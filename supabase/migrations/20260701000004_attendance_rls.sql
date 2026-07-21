-- School Sleek — Row Level Security for attendance (Phase 2)

alter table guardian_passes enable row level security;
alter table student_attendance enable row level security;
alter table teacher_attendance enable row level security;

-- ------------------------------------------------------------
-- guardian_passes: staff (admin/teacher) in the same school can manage;
-- a student can read passes tied to their own record (so they can see
-- what their guardian set up)
-- ------------------------------------------------------------
create policy "staff manage guardian_passes" on guardian_passes
  for all using (
    app_current_role() in ('admin', 'teacher')
    and student_id in (
      select s.id from students s
      join users u on u.id = s.user_id
      where u.school_id = current_school_id()
    )
  );

create policy "student reads own guardian_passes" on guardian_passes
  for select using (
    student_id in (select id from students where user_id = auth.uid())
  );

-- ------------------------------------------------------------
-- student_attendance: staff manage within school; student reads own
-- ------------------------------------------------------------
create policy "staff manage student_attendance" on student_attendance
  for all using (
    app_current_role() in ('admin', 'teacher')
    and student_id in (
      select s.id from students s
      join users u on u.id = s.user_id
      where u.school_id = current_school_id()
    )
  );

create policy "student reads own attendance" on student_attendance
  for select using (
    student_id in (select id from students where user_id = auth.uid())
  );

-- ------------------------------------------------------------
-- teacher_attendance: a teacher manages their own rows;
-- an admin reads/manages every teacher's rows in the school
-- ------------------------------------------------------------
create policy "teacher manages own attendance" on teacher_attendance
  for all using (
    teacher_id in (select id from teachers where user_id = auth.uid())
  );

create policy "admin manages teacher_attendance" on teacher_attendance
  for all using (
    app_current_role() = 'admin'
    and teacher_id in (
      select t.id from teachers t
      join users u on u.id = t.user_id
      where u.school_id = current_school_id()
    )
  );
