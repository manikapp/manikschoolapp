-- School Sleek — Auto-recalculation engine (Phase 5)
--
-- This is the centerpiece of the results pipeline: any insert, update, or delete
-- on student_assessment_scores automatically recalculates:
--   1. results — that subject's total_score, grade, and subject_position for
--      EVERY student in the same subject/class_arm/term (positions are relative,
--      so one student's corrected score can shift everyone else's rank)
--   2. student_term_summaries — the average and overall_position across all of
--      a student's subjects, for every student in the same class_arm/term
--   3. result_sheets — kept in sync (created if missing, incremented version if not)
--
-- Ranking uses standard competition ranking via RANK(): tied scores share a
-- position, and the next position is skipped (e.g. 95, 90, 90, 85 → 1, 2, 2, 4).

-- ============================================================
-- Recalculate one subject's results for a whole class_arm/term
-- ============================================================
create or replace function recalc_subject_results(p_subject_id uuid, p_class_arm_id uuid, p_term_id uuid)
returns void
language plpgsql
as $$
begin
  insert into results (student_id, subject_id, class_arm_id, term_id, total_score, processed_at)
  select
    sas.student_id,
    p_subject_id,
    p_class_arm_id,
    p_term_id,
    sum(sas.score),
    now()
  from student_assessment_scores sas
  where sas.subject_id = p_subject_id
    and sas.class_arm_id = p_class_arm_id
    and sas.term_id = p_term_id
  group by sas.student_id
  on conflict (student_id, subject_id, term_id)
  do update set total_score = excluded.total_score, processed_at = now();

  -- drop result rows for students who no longer have any score in this subject/term
  delete from results r
  where r.subject_id = p_subject_id
    and r.class_arm_id = p_class_arm_id
    and r.term_id = p_term_id
    and not exists (
      select 1 from student_assessment_scores sas
      where sas.student_id = r.student_id
        and sas.subject_id = p_subject_id
        and sas.term_id = p_term_id
    );

  -- resolve grade from grading_scales (junior/senior derived from the class arm's level)
  update results r
  set grade = gs.grade
  from class_arms ca
  join grading_scales gs on gs.school_id = ca.school_id
  where r.class_arm_id = ca.id
    and r.subject_id = p_subject_id
    and r.class_arm_id = p_class_arm_id
    and r.term_id = p_term_id
    and gs.level_group = case when ca.level in ('jss1', 'jss2', 'jss3') then 'junior'::level_group else 'senior'::level_group end
    and r.total_score >= gs.min_score
    and r.total_score <= gs.max_score;

  -- standard competition ranking: RANK() naturally skips positions after a tie
  with ranked as (
    select id, rank() over (order by total_score desc) as pos
    from results
    where subject_id = p_subject_id and class_arm_id = p_class_arm_id and term_id = p_term_id
  )
  update results r
  set subject_position = ranked.pos
  from ranked
  where r.id = ranked.id;
end;
$$;

-- ============================================================
-- Recalculate the whole-class term summary + keep result_sheets in sync
-- ============================================================
create or replace function recalc_term_summary(p_class_arm_id uuid, p_term_id uuid)
returns void
language plpgsql
as $$
declare
  v_class_size int;
begin
  insert into student_term_summaries (student_id, class_arm_id, term_id, total_score_sum, subjects_offered, average_score, processed_at)
  select
    r.student_id,
    p_class_arm_id,
    p_term_id,
    sum(r.total_score),
    count(*),
    round(sum(r.total_score) / count(*), 2),
    now()
  from results r
  where r.class_arm_id = p_class_arm_id and r.term_id = p_term_id
  group by r.student_id
  on conflict (student_id, term_id)
  do update set
    total_score_sum = excluded.total_score_sum,
    subjects_offered = excluded.subjects_offered,
    average_score = excluded.average_score,
    processed_at = now();

  delete from student_term_summaries sts
  where sts.class_arm_id = p_class_arm_id
    and sts.term_id = p_term_id
    and not exists (
      select 1 from results r
      where r.student_id = sts.student_id and r.class_arm_id = p_class_arm_id and r.term_id = p_term_id
    );

  select count(*) into v_class_size
  from student_term_summaries
  where class_arm_id = p_class_arm_id and term_id = p_term_id;

  with ranked as (
    select id, rank() over (order by average_score desc) as pos
    from student_term_summaries
    where class_arm_id = p_class_arm_id and term_id = p_term_id
  )
  update student_term_summaries sts
  set overall_position = ranked.pos, class_size = v_class_size
  from ranked
  where sts.id = ranked.id;

  -- result_sheets: create the first time, bump the version on every recalculation
  -- after that. is_published/pdf_url are left untouched here on purpose — a
  -- correction shouldn't silently unpublish something an admin already released.
  insert into result_sheets (student_id, class_arm_id, term_id, average_score, overall_position, class_size, version, last_recalculated_at)
  select student_id, class_arm_id, term_id, average_score, overall_position, class_size, 1, now()
  from student_term_summaries
  where class_arm_id = p_class_arm_id and term_id = p_term_id
  on conflict (student_id, term_id)
  do update set
    average_score = excluded.average_score,
    overall_position = excluded.overall_position,
    class_size = excluded.class_size,
    version = result_sheets.version + 1,
    last_recalculated_at = now();
end;
$$;

-- ============================================================
-- Trigger: fires the cascade on every score change
-- ============================================================
create or replace function trg_recalc_from_score_change()
returns trigger
language plpgsql
as $$
declare
  v_subject_id uuid;
  v_class_arm_id uuid;
  v_term_id uuid;
begin
  if tg_op = 'DELETE' then
    v_subject_id := old.subject_id;
    v_class_arm_id := old.class_arm_id;
    v_term_id := old.term_id;
  else
    v_subject_id := new.subject_id;
    v_class_arm_id := new.class_arm_id;
    v_term_id := new.term_id;
  end if;

  perform recalc_subject_results(v_subject_id, v_class_arm_id, v_term_id);
  perform recalc_term_summary(v_class_arm_id, v_term_id);

  return null; -- AFTER trigger — return value is ignored, but a value is required
end;
$$;

create trigger student_assessment_scores_recalc
after insert or update or delete on student_assessment_scores
for each row execute function trg_recalc_from_score_change();

comment on trigger student_assessment_scores_recalc on student_assessment_scores is
  'Fires per-row. Fine for normal teacher entry and CBT auto-scoring. For a large CSV
   bulk upload (hundreds of rows at once), this recalculates the whole class repeatedly
   — correct, but wasteful. A worthwhile optimization once bulk upload is built: disable
   this trigger for the duration of the batch insert, then call recalc_subject_results
   and recalc_term_summary once manually at the end.';
