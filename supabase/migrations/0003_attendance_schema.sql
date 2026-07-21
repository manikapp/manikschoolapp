-- School Sleek — Attendance & Time-Tracking schema (Phase 2)

create type attendance_method as enum ('qr', 'manual');
create type guardian_pass_status as enum ('pending', 'used', 'expired');

create table guardian_passes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  guardian_name varchar not null,
  guardian_phone varchar not null,
  guardian_photo_url varchar,
  relationship varchar,
  valid_from timestamptz not null,
  valid_to timestamptz not null,
  status guardian_pass_status not null default 'pending',
  created_by uuid references guardians(id),
  created_at timestamptz not null default now()
);
create index idx_guardian_passes_student on guardian_passes(student_id);

create table student_attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  date date not null default current_date,
  clock_in_time timestamptz,
  clock_out_time timestamptz,
  clocked_in_by uuid references users(id),
  method attendance_method not null default 'qr',
  guardian_pass_id uuid references guardian_passes(id),
  whatsapp_notified boolean not null default false,
  unique (student_id, date)
);
create index idx_student_attendance_date on student_attendance(date);

create table teacher_attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references teachers(id) on delete cascade,
  date date not null default current_date,
  time_in timestamptz,
  time_out timestamptz,
  device_info varchar,
  whatsapp_notified_admin boolean not null default false,
  unique (teacher_id, date)
);
create index idx_teacher_attendance_date on teacher_attendance(date);
