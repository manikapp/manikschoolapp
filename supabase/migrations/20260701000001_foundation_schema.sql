-- School Sleek — Foundation schema (Phase 1)
-- Schools, users/roles, digital ID/QR fields, and the Nigerian academic structure
-- (sessions, terms, class arms, departments) that students/classes depend on.

create extension if not exists pgcrypto;

-- ============================================================
-- ENUMS
-- ============================================================
create type user_role as enum ('admin', 'teacher', 'student');
create type user_status as enum ('active', 'suspended', 'graduated');
create type class_level as enum ('jss1', 'jss2', 'jss3', 'sss1', 'sss2', 'sss3');
create type term_name as enum ('first', 'second', 'third');
create type enrollment_status as enum ('active', 'promoted', 'repeated', 'transferred', 'graduated');
create type department_from as enum ('sss1', 'sss2', 'sss3');

-- ============================================================
-- CORE: SCHOOLS & USERS
-- ============================================================
create table schools (
  id uuid primary key default gen_random_uuid(),
  name varchar not null,
  address varchar,
  phone varchar,
  email varchar,
  logo_url varchar,
  created_at timestamptz not null default now()
);

-- One row per authenticated person, keyed to Supabase's own auth.users table.
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  school_id uuid not null references schools(id) on delete cascade,
  role user_role not null,
  user_code varchar unique not null,       -- printed on the ID card / encoded in the QR
  qr_token varchar unique not null,        -- signed token embedded in the QR payload
  first_name varchar not null,
  last_name varchar not null,
  email varchar unique,
  phone varchar,
  photo_url varchar,
  status user_status not null default 'active',
  created_at timestamptz not null default now()
);
create index idx_users_school on users(school_id);
create index idx_users_role on users(school_id, role);

-- ============================================================
-- ACADEMIC CALENDAR: SESSIONS, TERMS, CLASS ARMS
-- ============================================================
create table academic_sessions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name varchar not null,                   -- e.g. "2025/2026"
  start_date date,
  end_date date,
  is_current boolean not null default false,
  unique (school_id, name)
);

create table terms (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references academic_sessions(id) on delete cascade,
  name term_name not null,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  unique (session_id, name)
);

create table departments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name varchar not null,                   -- e.g. "Science", "Arts", "Commercial"
  applicable_from department_from not null default 'sss1'
);

create table class_arms (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  session_id uuid not null references academic_sessions(id) on delete cascade,
  level class_level not null,
  arm_name varchar not null,                -- e.g. "A", "B", "Gold"
  display_name varchar not null,            -- e.g. "JSS1A", "SSS2B"
  department_id uuid references departments(id),
  class_teacher_id uuid references users(id),
  capacity int,
  unique (session_id, level, arm_name)
);

create table subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name varchar not null,
  code varchar
);

create table department_subjects (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  is_compulsory boolean not null default true,
  unique (department_id, subject_id)
);

create table class_subject_teachers (
  id uuid primary key default gen_random_uuid(),
  class_arm_id uuid not null references class_arms(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  teacher_id uuid not null references users(id),
  unique (class_arm_id, subject_id)
);

-- ============================================================
-- ROLE EXTENSION TABLES
-- ============================================================
create table students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  admission_number varchar unique not null,
  current_class_arm_id uuid references class_arms(id),
  department_id uuid references departments(id),
  date_of_birth date,
  gender varchar,
  enrollment_date date not null default current_date
);

create table teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  staff_number varchar unique not null,
  department varchar,
  hire_date date
);

create table admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  position varchar
);

create table guardians (
  id uuid primary key default gen_random_uuid(),
  full_name varchar not null,
  phone varchar unique not null,
  email varchar
);

create table student_guardians (
  student_id uuid not null references students(id) on delete cascade,
  guardian_id uuid not null references guardians(id) on delete cascade,
  relationship varchar,
  is_primary_contact boolean not null default false,
  primary key (student_id, guardian_id)
);

create table student_class_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  class_arm_id uuid not null references class_arms(id) on delete cascade,
  session_id uuid not null references academic_sessions(id) on delete cascade,
  status enrollment_status not null default 'active',
  enrolled_date date not null default current_date,
  unique (student_id, session_id)
);

-- ============================================================
-- HELPER: keep a role extension table's user_id in sync
-- ============================================================
comment on table users is 'One row per person, mirrored from auth.users. role determines which of students/teachers/admins has the matching extension row.';
