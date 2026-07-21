-- School Sleek — Row Level Security for documents (Phase 4)
-- Everything here is an admin-authoring tool, so the pattern is simple:
-- read for everyone in the school (a teacher might need to pull a score sheet
-- they were asked to fill), write for admins only.

alter table school_stamps enable row level security;
alter table letterhead_templates enable row level security;
alter table letters enable row level security;
alter table score_sheet_templates enable row level security;
alter table score_sheets enable row level security;

create policy "read school_stamps" on school_stamps
  for select using (school_id = current_school_id());
create policy "admin writes school_stamps" on school_stamps
  for all using (app_current_role() = 'admin' and school_id = current_school_id());

create policy "read letterhead_templates" on letterhead_templates
  for select using (school_id = current_school_id());
create policy "admin writes letterhead_templates" on letterhead_templates
  for all using (app_current_role() = 'admin' and school_id = current_school_id());

create policy "read letters" on letters
  for select using (school_id = current_school_id());
create policy "admin writes letters" on letters
  for all using (app_current_role() = 'admin' and school_id = current_school_id());

create policy "read score_sheet_templates" on score_sheet_templates
  for select using (school_id = current_school_id());
create policy "admin writes score_sheet_templates" on score_sheet_templates
  for all using (app_current_role() = 'admin' and school_id = current_school_id());

create policy "read score_sheets" on score_sheets
  for select using (school_id = current_school_id());
create policy "admin writes score_sheets" on score_sheets
  for all using (app_current_role() = 'admin' and school_id = current_school_id());
