-- School Sleek — Fees & Clearance schema (Phase 3)

create table fee_structures (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  level class_level not null,
  term_id uuid not null references terms(id) on delete cascade,
  amount numeric(12, 2) not null,
  description varchar not null,
  unique (school_id, level, term_id, description)
);

create table fee_payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  amount numeric(12, 2) not null,
  description varchar not null,
  payment_date date not null default current_date,
  term_id uuid not null references terms(id) on delete cascade,
  receipt_number varchar unique not null,
  processed_by uuid references users(id),
  created_at timestamptz not null default now()
);
create index idx_fee_payments_student on fee_payments(student_id);
create index idx_fee_payments_term on fee_payments(term_id);

comment on table fee_payments is
  'Each row is a payment actually received (a payment is only ever recorded once it has
   happened — there is no "owing" status per row). Overall clearance for a student/term
   is computed by comparing the sum of their fee_payments against the relevant
   fee_structures total, not stored as a column — see /api/fee-clearance.';
