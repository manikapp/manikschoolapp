-- ManikSchoolApp — Super Admin RLS grant (Phase: multi-school platform admin)
--
-- Adds one supplemental policy per table: a super admin (is_super_admin() = true)
-- gets full access regardless of school_id. This is ADDITIVE -- every existing
-- school-scoped policy stays exactly as it was; a super admin just also matches
-- this new policy, which grants access on top.

create policy "super_admin full access" on academic_sessions
  for all using (is_super_admin());

create policy "super_admin full access" on admins
  for all using (is_super_admin());

create policy "super_admin full access" on assessment_components
  for all using (is_super_admin());

create policy "super_admin full access" on bulk_uploads
  for all using (is_super_admin());

create policy "super_admin full access" on class_arms
  for all using (is_super_admin());

create policy "super_admin full access" on class_subject_teachers
  for all using (is_super_admin());

create policy "super_admin full access" on department_subjects
  for all using (is_super_admin());

create policy "super_admin full access" on departments
  for all using (is_super_admin());

create policy "super_admin full access" on exam_answers
  for all using (is_super_admin());

create policy "super_admin full access" on exam_anticheat_logs
  for all using (is_super_admin());

create policy "super_admin full access" on exam_attempts
  for all using (is_super_admin());

create policy "super_admin full access" on exam_questions
  for all using (is_super_admin());

create policy "super_admin full access" on exams
  for all using (is_super_admin());

create policy "super_admin full access" on fee_payments
  for all using (is_super_admin());

create policy "super_admin full access" on fee_structures
  for all using (is_super_admin());

create policy "super_admin full access" on grading_scales
  for all using (is_super_admin());

create policy "super_admin full access" on guardian_passes
  for all using (is_super_admin());

create policy "super_admin full access" on guardians
  for all using (is_super_admin());

create policy "super_admin full access" on letterhead_templates
  for all using (is_super_admin());

create policy "super_admin full access" on letters
  for all using (is_super_admin());

create policy "super_admin full access" on result_sheets
  for all using (is_super_admin());

create policy "super_admin full access" on results
  for all using (is_super_admin());

create policy "super_admin full access" on school_stamps
  for all using (is_super_admin());

create policy "super_admin full access" on schools
  for all using (is_super_admin());

create policy "super_admin full access" on score_sheet_templates
  for all using (is_super_admin());

create policy "super_admin full access" on score_sheets
  for all using (is_super_admin());

create policy "super_admin full access" on student_assessment_scores
  for all using (is_super_admin());

create policy "super_admin full access" on student_attendance
  for all using (is_super_admin());

create policy "super_admin full access" on student_class_enrollments
  for all using (is_super_admin());

create policy "super_admin full access" on student_guardians
  for all using (is_super_admin());

create policy "super_admin full access" on student_term_summaries
  for all using (is_super_admin());

create policy "super_admin full access" on students
  for all using (is_super_admin());

create policy "super_admin full access" on subjects
  for all using (is_super_admin());

create policy "super_admin full access" on teacher_attendance
  for all using (is_super_admin());

create policy "super_admin full access" on teachers
  for all using (is_super_admin());

create policy "super_admin full access" on terms
  for all using (is_super_admin());

create policy "super_admin full access" on users
  for all using (is_super_admin());

