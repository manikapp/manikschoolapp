-- School Sleek — Documents & Branding schema (Phase 4)

create table school_stamps (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  image_url varchar not null,      -- generated SVG, stored in Supabase Storage (see README)
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table letterhead_templates (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name varchar not null,
  style_config jsonb not null default '{}'::jsonb   -- accent color, layout choice, etc.
);

create table letters (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  template_id uuid references letterhead_templates(id),
  title varchar not null,
  body text not null,
  recipient varchar,
  pdf_url varchar,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table score_sheet_templates (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name varchar not null,
  template_config jsonb not null default '{}'::jsonb  -- which columns (CA1/CA2/Exam/etc.) to print
);

create table score_sheets (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  class_arm_id uuid not null references class_arms(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  term_id uuid not null references terms(id) on delete cascade,
  template_id uuid references score_sheet_templates(id),
  pdf_url varchar,
  generated_by uuid references users(id),
  created_at timestamptz not null default now()
);
