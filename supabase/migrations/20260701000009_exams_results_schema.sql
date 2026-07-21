-- School Sleek — Exams & Results schema (Phase 5)

create type exam_type as enum ('print', 'cbt');
create type exam_status as enum ('draft', 'pending_review', 'approved', 'published');
create type question_type as enum ('mcq', 'theory');
create type attempt_status as enum ('in_progress', 'submitted', 'auto_submitted');
create type anticheat_event_type as enum ('tab_switch', 'minimize', 'blur', 'copy_attempt');
create type score_source as enum ('manual', 'csv_import', 'cbt_auto');
create type level_group as enum ('junior', 'senior');

-- ============================================================
-- Flexible CA/exam component structure (school-configurable)
-- ============================================================
create table assessment_components (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name varchar not null,             -- e.g. "CA1", "CA2", "CA3", "Exam"
  category varchar not null default 'ca', -- 'ca' or 'exam', for reporting groupings
  max_score numeric(6, 2) not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table grading_scales (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  level_group level_group not null,
  min_score numeric(5, 2) not null,
  max_score numeric(5, 2) not null,
  grade varchar not null,           -- e.g. "A1", "B2", "C4", "F9"
  remark varchar,                   -- e.g. "Excellent", "Pass", "Fail"
  grade_point numeric(4, 2)
);
create index idx_grading_scales_school on grading_scales(school_id, level_group);

-- ============================================================
-- Exams (print or CBT)
-- ============================================================
create table exams (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  subject_id uuid not null references subjects(id),
  class_arm_id uuid not null references class_arms(id),
  term_id uuid not null references terms(id),
  assessment_component_id uuid references assessment_components(id),
  teacher_id uuid not null references teachers(id),
  title varchar not null,
  type exam_type not null default 'cbt',
  status exam_status not null default 'draft',
  duration_minutes int,
  total_marks int,
  approved_by uuid references admins(id),
  created_at timestamptz not null default now()
);

create table exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  question_text text not null,
  question_type question_type not null default 'mcq',
  options jsonb,                    -- e.g. {"A": "...", "B": "...", "C": "...", "D": "..."}
  correct_answer text,
  marks int not null default 1,
  sort_order int not null default 0
);

create table exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  start_time timestamptz not null default now(),
  end_time timestamptz,
  status attempt_status not null default 'in_progress',
  score numeric(6, 2),
  unique (exam_id, student_id)
);

create table exam_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references exam_attempts(id) on delete cascade,
  question_id uuid not null references exam_questions(id) on delete cascade,
  answer text,
  is_correct boolean,
  marks_awarded numeric(6, 2),
  unique (attempt_id, question_id)
);

create table exam_anticheat_logs (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references exam_attempts(id) on delete cascade,
  event_type anticheat_event_type not null,
  occurred_at timestamptz not null default now()
);

-- ============================================================
-- Scores → results → term summaries → result sheets
-- (see 0010_exams_results_functions.sql for the auto-recalculation engine)
-- ============================================================
create table student_assessment_scores (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  subject_id uuid not null references subjects(id),
  class_arm_id uuid not null references class_arms(id),
  term_id uuid not null references terms(id),
  assessment_component_id uuid not null references assessment_components(id),
  score numeric(6, 2) not null,
  source score_source not null default 'manual',
  exam_attempt_id uuid references exam_attempts(id),
  recorded_by uuid references users(id),
  recorded_at timestamptz not null default now(),
  unique (student_id, subject_id, term_id, assessment_component_id)
);
create index idx_scores_lookup on student_assessment_scores(class_arm_id, subject_id, term_id);

create table results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  subject_id uuid not null references subjects(id),
  class_arm_id uuid not null references class_arms(id),
  term_id uuid not null references terms(id),
  total_score numeric(6, 2) not null default 0,
  grade varchar,
  subject_position int,
  remarks text,
  processed_at timestamptz not null default now(),
  unique (student_id, subject_id, term_id)
);
create index idx_results_lookup on results(class_arm_id, subject_id, term_id);

create table student_term_summaries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  class_arm_id uuid not null references class_arms(id),
  term_id uuid not null references terms(id),
  total_score_sum numeric(8, 2) not null default 0,
  subjects_offered int not null default 0,
  average_score numeric(6, 2) not null default 0,
  overall_position int,
  class_size int,
  processed_at timestamptz not null default now(),
  unique (student_id, term_id)
);
create index idx_term_summaries_lookup on student_term_summaries(class_arm_id, term_id);

create table result_sheets (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  class_arm_id uuid not null references class_arms(id),
  term_id uuid not null references terms(id),
  average_score numeric(6, 2),
  overall_position int,
  class_size int,
  version int not null default 1,
  last_recalculated_at timestamptz not null default now(),
  pdf_url varchar,
  stamp_applied boolean not null default false,
  access_token varchar,
  is_published boolean not null default false,
  published_at timestamptz,
  published_by uuid references admins(id),
  generated_by uuid references admins(id),
  unique (student_id, term_id)
);

-- ============================================================
-- Bulk upload tracking (exam questions or assessment scores via CSV)
-- ============================================================
create table bulk_uploads (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  uploaded_by uuid references users(id),
  type varchar not null,             -- 'exam_questions' or 'assessment_scores'
  target_id uuid,                    -- exam_id, or left null for score uploads (see error_log)
  file_url varchar,
  status varchar not null default 'processing',
  row_count int,
  error_log jsonb,
  created_at timestamptz not null default now()
);
