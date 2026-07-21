-- School Sleek — Row Level Security for exams & results (Phase 5)

alter table assessment_components enable row level security;
alter table grading_scales enable row level security;
alter table exams enable row level security;
alter table exam_questions enable row level security;
alter table exam_attempts enable row level security;
alter table exam_answers enable row level security;
alter table exam_anticheat_logs enable row level security;
alter table student_assessment_scores enable row level security;
alter table results enable row level security;
alter table student_term_summaries enable row level security;
alter table result_sheets enable row level security;
alter table bulk_uploads enable row level security;

-- ------------------------------------------------------------
-- assessment_components / grading_scales: read for everyone in school,
-- write for admins only
-- ------------------------------------------------------------
create policy "read assessment_components" on assessment_components
  for select using (school_id = current_school_id());
create policy "admin writes assessment_components" on assessment_components
  for all using (app_current_role() = 'admin' and school_id = current_school_id());

create policy "read grading_scales" on grading_scales
  for select using (school_id = current_school_id());
create policy "admin writes grading_scales" on grading_scales
  for all using (app_current_role() = 'admin' and school_id = current_school_id());

-- ------------------------------------------------------------
-- exams: teacher manages their own; admin manages all in school;
-- a student can only see a PUBLISHED exam for their own class arm
-- ------------------------------------------------------------
create policy "teacher manages own exams" on exams
  for all using (teacher_id in (select id from teachers where user_id = auth.uid()));

create policy "admin manages school exams" on exams
  for all using (app_current_role() = 'admin' and school_id = current_school_id());

create policy "student reads published exams for own class" on exams
  for select using (
    status = 'published'
    and class_arm_id in (
      select class_arm_id from students where user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- exam_questions: follows the parent exam's access (teacher/admin can
-- always see their own exam's questions; a student only once published)
-- ------------------------------------------------------------
create policy "manage exam_questions via parent exam" on exam_questions
  for all using (
    exam_id in (
      select id from exams
      where teacher_id in (select id from teachers where user_id = auth.uid())
         or (app_current_role() = 'admin' and school_id = current_school_id())
    )
  );

create policy "student reads questions of published exam" on exam_questions
  for select using (
    exam_id in (
      select id from exams
      where status = 'published'
        and class_arm_id in (select class_arm_id from students where user_id = auth.uid())
    )
  );

-- ------------------------------------------------------------
-- exam_attempts / exam_answers: a student manages only their own attempt;
-- the teacher who owns the exam can read attempts (for live invigilation)
-- ------------------------------------------------------------
create policy "student manages own attempts" on exam_attempts
  for all using (student_id in (select id from students where user_id = auth.uid()));

create policy "teacher reads attempts on own exams" on exam_attempts
  for select using (
    exam_id in (select id from exams where teacher_id in (select id from teachers where user_id = auth.uid()))
  );

create policy "student manages own answers" on exam_answers
  for all using (
    attempt_id in (
      select ea.id from exam_attempts ea
      join students s on s.id = ea.student_id
      where s.user_id = auth.uid()
    )
  );

create policy "teacher reads answers on own exams" on exam_answers
  for select using (
    attempt_id in (
      select ea.id from exam_attempts ea
      join exams e on e.id = ea.exam_id
      where e.teacher_id in (select id from teachers where user_id = auth.uid())
    )
  );

-- ------------------------------------------------------------
-- exam_anticheat_logs: student's own client posts events; teacher who
-- owns the exam reads them (the live invigilation feed)
-- ------------------------------------------------------------
create policy "student posts own anticheat events" on exam_anticheat_logs
  for insert with check (
    attempt_id in (
      select ea.id from exam_attempts ea
      join students s on s.id = ea.student_id
      where s.user_id = auth.uid()
    )
  );

create policy "teacher reads anticheat logs on own exams" on exam_anticheat_logs
  for select using (
    attempt_id in (
      select ea.id from exam_attempts ea
      join exams e on e.id = ea.exam_id
      where e.teacher_id in (select id from teachers where user_id = auth.uid())
    )
  );

-- ------------------------------------------------------------
-- student_assessment_scores: staff (admin/teacher) manage within school;
-- a student reads their own
-- ------------------------------------------------------------
create policy "staff manage assessment_scores" on student_assessment_scores
  for all using (
    app_current_role() in ('admin', 'teacher')
    and class_arm_id in (select id from class_arms where school_id = current_school_id())
  );

create policy "student reads own assessment_scores" on student_assessment_scores
  for select using (student_id in (select id from students where user_id = auth.uid()));

-- ------------------------------------------------------------
-- results / student_term_summaries: staff read within school; student own only
-- ------------------------------------------------------------
create policy "staff read results" on results
  for select using (
    app_current_role() in ('admin', 'teacher')
    and class_arm_id in (select id from class_arms where school_id = current_school_id())
  );
create policy "student reads own results" on results
  for select using (student_id in (select id from students where user_id = auth.uid()));

create policy "staff read term_summaries" on student_term_summaries
  for select using (
    app_current_role() in ('admin', 'teacher')
    and class_arm_id in (select id from class_arms where school_id = current_school_id())
  );
create policy "student reads own term_summary" on student_term_summaries
  for select using (student_id in (select id from students where user_id = auth.uid()));

-- ------------------------------------------------------------
-- result_sheets: staff manage within school (including publishing);
-- a student only sees their own, and ONLY once published
-- ------------------------------------------------------------
create policy "staff manage result_sheets" on result_sheets
  for all using (
    app_current_role() in ('admin', 'teacher')
    and class_arm_id in (select id from class_arms where school_id = current_school_id())
  );

create policy "student reads own published result_sheet" on result_sheets
  for select using (
    is_published = true
    and student_id in (select id from students where user_id = auth.uid())
  );

-- ------------------------------------------------------------
-- bulk_uploads: staff only, scoped to school
-- ------------------------------------------------------------
create policy "staff manage bulk_uploads" on bulk_uploads
  for all using (
    app_current_role() in ('admin', 'teacher')
    and school_id = current_school_id()
  );
