-- School Sleek — Row Level Security for fees (Phase 3)

alter table fee_structures enable row level security;
alter table fee_payments enable row level security;

-- ------------------------------------------------------------
-- fee_structures: everyone in the school can read (so students/parents
-- can see what's expected); only admins write
-- ------------------------------------------------------------
create policy "read fee_structures" on fee_structures
  for select using (school_id = current_school_id());

create policy "admin writes fee_structures" on fee_structures
  for all using (app_current_role() = 'admin' and school_id = current_school_id());

-- ------------------------------------------------------------
-- fee_payments: admins manage within school; a student reads only their own
-- ------------------------------------------------------------
create policy "admin manages fee_payments" on fee_payments
  for all using (
    app_current_role() = 'admin'
    and student_id in (
      select s.id from students s
      join users u on u.id = s.user_id
      where u.school_id = current_school_id()
    )
  );

create policy "student reads own fee_payments" on fee_payments
  for select using (
    student_id in (select id from students where user_id = auth.uid())
  );
