-- School Sleek — Row Level Security (Phase 1)
-- Every table is scoped to the caller's school, with role-appropriate read/write access.
-- This is a v1 baseline: admins get broad school-scoped access, teachers get read access
-- to their school, students are restricted to their own record. Tighten per-table as
-- later modules (results, fees, attendance) are added — those will need narrower policies
-- (e.g. a student should only ever read THEIR OWN results, not a classmate's).

-- ------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so they can read `users`
-- regardless of the calling row's own RLS policy)
-- ------------------------------------------------------------
create or replace function current_school_id()
returns uuid
language sql
security definer
stable
as $$
  select school_id from users where id = auth.uid();
$$;

create or replace function app_current_role()
returns user_role
language sql
security definer
stable
as $$
  select role from users where id = auth.uid();
$$;

-- ------------------------------------------------------------
-- Enable RLS everywhere
-- ------------------------------------------------------------
alter table schools enable row level security;
alter table users enable row level security;
alter table academic_sessions enable row level security;
alter table terms enable row level security;
alter table departments enable row level security;
alter table class_arms enable row level security;
alter table subjects enable row level security;
alter table department_subjects enable row level security;
alter table class_subject_teachers enable row level security;
alter table students enable row level security;
alter table teachers enable row level security;
alter table admins enable row level security;
alter table guardians enable row level security;
alter table student_guardians enable row level security;
alter table student_class_enrollments enable row level security;

-- ------------------------------------------------------------
-- schools: a user can only see their own school
-- ------------------------------------------------------------
create policy "select own school" on schools
  for select using (id = current_school_id());

-- ------------------------------------------------------------
-- users: everyone in a school can see each other's basic directory row;
-- only admins can insert/update (user creation is an admin action).
-- ------------------------------------------------------------
create policy "select users in own school" on users
  for select using (school_id = current_school_id());

create policy "admin manages users" on users
  for insert with check (app_current_role() = 'admin');

create policy "admin updates users" on users
  for update using (app_current_role() = 'admin' and school_id = current_school_id());

-- ------------------------------------------------------------
-- academic structure: read for everyone in the school, write for admins only
-- ------------------------------------------------------------
create policy "read academic_sessions" on academic_sessions
  for select using (school_id = current_school_id());
create policy "admin writes academic_sessions" on academic_sessions
  for all using (app_current_role() = 'admin' and school_id = current_school_id())
  with check (app_current_role() = 'admin' and school_id = current_school_id());

create policy "read terms" on terms
  for select using (
    session_id in (select id from academic_sessions where school_id = current_school_id())
  );
create policy "admin writes terms" on terms
  for all using (
    app_current_role() = 'admin'
    and session_id in (select id from academic_sessions where school_id = current_school_id())
  );

create policy "read departments" on departments
  for select using (school_id = current_school_id());
create policy "admin writes departments" on departments
  for all using (app_current_role() = 'admin' and school_id = current_school_id());

create policy "read class_arms" on class_arms
  for select using (school_id = current_school_id());
create policy "admin writes class_arms" on class_arms
  for all using (app_current_role() = 'admin' and school_id = current_school_id());

create policy "read subjects" on subjects
  for select using (school_id = current_school_id());
create policy "admin writes subjects" on subjects
  for all using (app_current_role() = 'admin' and school_id = current_school_id());

create policy "read department_subjects" on department_subjects
  for select using (
    department_id in (select id from departments where school_id = current_school_id())
  );
create policy "admin writes department_subjects" on department_subjects
  for all using (
    app_current_role() = 'admin'
    and department_id in (select id from departments where school_id = current_school_id())
  );

create policy "read class_subject_teachers" on class_subject_teachers
  for select using (
    class_arm_id in (select id from class_arms where school_id = current_school_id())
  );
create policy "admin writes class_subject_teachers" on class_subject_teachers
  for all using (
    app_current_role() = 'admin'
    and class_arm_id in (select id from class_arms where school_id = current_school_id())
  );

-- ------------------------------------------------------------
-- students: admins/teachers see all students in the school;
-- a student can only see their own row
-- ------------------------------------------------------------
create policy "staff read students" on students
  for select using (
    app_current_role() in ('admin', 'teacher')
    and user_id in (select id from users where school_id = current_school_id())
  );
create policy "student reads self" on students
  for select using (user_id = auth.uid());
create policy "admin writes students" on students
  for all using (
    app_current_role() = 'admin'
    and user_id in (select id from users where school_id = current_school_id())
  );

create policy "staff read teachers" on teachers
  for select using (
    app_current_role() in ('admin', 'teacher')
    and user_id in (select id from users where school_id = current_school_id())
  );
create policy "teacher reads self" on teachers
  for select using (user_id = auth.uid());
create policy "admin writes teachers" on teachers
  for all using (
    app_current_role() = 'admin'
    and user_id in (select id from users where school_id = current_school_id())
  );

create policy "admin reads admins" on admins
  for select using (
    app_current_role() = 'admin'
    and user_id in (select id from users where school_id = current_school_id())
  );
create policy "admin writes admins" on admins
  for all using (
    app_current_role() = 'admin'
    and user_id in (select id from users where school_id = current_school_id())
  );

-- ------------------------------------------------------------
-- guardians / student_guardians: staff can manage; a guardian isn't
-- a logged-in `users` row in v1 (see design doc), so no self-select policy yet
-- ------------------------------------------------------------
create policy "staff manage guardians" on guardians
  for all using (app_current_role() in ('admin', 'teacher'));

create policy "staff manage student_guardians" on student_guardians
  for all using (
    app_current_role() in ('admin', 'teacher')
    and student_id in (
      select s.id from students s
      join users u on u.id = s.user_id
      where u.school_id = current_school_id()
    )
  );

-- ------------------------------------------------------------
-- student_class_enrollments: staff read/write in-school, student reads own
-- ------------------------------------------------------------
create policy "staff manage enrollments" on student_class_enrollments
  for all using (
    app_current_role() in ('admin', 'teacher')
    and class_arm_id in (select id from class_arms where school_id = current_school_id())
  );
create policy "student reads own enrollments" on student_class_enrollments
  for select using (
    student_id in (select id from students where user_id = auth.uid())
  );
