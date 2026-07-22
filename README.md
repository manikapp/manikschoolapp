# School Sleek

Digital school management platform — Foundation phase scaffold (auth, users, digital ID/QR,
and the Nigerian academic structure: sessions, terms, class arms, departments).

This is phase 1 of the roadmap in the project's system design doc. Attendance, exams, results,
fees, and e-learning build on top of this in later phases.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Supabase (Postgres + Auth + Row Level Security)
- `qrcode` for digital ID card QR generation

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the migration files **in order**:
   - `supabase/migrations/20260701000001_foundation_schema.sql`
   - `supabase/migrations/20260701000002_rls_policies.sql`
   - `supabase/migrations/20260701000003_attendance_schema.sql`
   - `supabase/migrations/20260701000004_attendance_rls.sql`
   - `supabase/migrations/20260701000005_fees_schema.sql`
   - `supabase/migrations/20260701000006_fees_rls.sql`
   - `supabase/migrations/20260701000007_documents_schema.sql`
   - `supabase/migrations/20260701000008_documents_rls.sql`
   - `supabase/migrations/20260701000009_exams_results_schema.sql`
   - `supabase/migrations/20260701000010_exams_results_functions.sql`
   - `supabase/migrations/20260701000011_exams_results_rls.sql`
3. Go to **Storage** and create a new bucket named `documents`, set to **public**. This
   is where generated stamps, letters, and score sheet PDFs get uploaded — it's a
   dashboard action, not part of the SQL migrations, since bucket creation/policies
   work a bit differently from table RLS.
4. Go to **Settings > API** and copy your **Project URL** and **anon public key**.
5. Go to **Authentication > Providers** and make sure Email is enabled.

### Creating your first school + admin user

Visit `/signup` (once running — see below) to register a new school and its first
admin account in one step, no manual SQL required. This uses a privileged server-side
route (`app/api/auth/register-school`) that needs the **service role key**, not just
the anon key — see the env var setup below.

If you'd rather do it by hand (e.g. debugging, or seeding a school without going
through the UI), the old manual path still works:

```sql
insert into schools (name) values ('Greenfield High School') returning id;
-- copy the returned id, then:
insert into users (id, school_id, role, user_code, qr_token, first_name, last_name, email)
values (
  '<the auth.users id of the person you signed up>',
  '<the school id from above>',
  'admin',
  'GHS-ADM-0001',
  '<generate via lib/qr.ts generateQrToken, or a placeholder for now>',
  'Ada',
  'Okafor',
  'admin@greenfield.edu.ng'
);
```

Teacher and student accounts are still admin-created rather than self-signup — that
part of the design (accounts need someone to vouch for the role/enrollment) hasn't
changed, only the *first* admin per school now has a proper onboarding flow.

## 2. Run locally

```bash
npm install
cp .env.example .env.local
# fill in .env.local: Supabase URL, anon key, service role key, and a random QR_SIGNING_SECRET
npm run dev
```

Visit `http://localhost:3000` — it'll redirect to `/login`, which links to `/signup`.

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Foundation phase: auth, users, academic structure"
git branch -M main
git remote add origin https://github.com/<your-username>/manikschoolapp.git
git push -u origin main
```

(Create the empty repo on GitHub first, named `manikschoolapp`, via github.com's
"New repository" button — don't initialize it with a README so the push above
doesn't conflict.)

## 4. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo you just pushed.
2. Vercel will auto-detect Next.js — no build config changes needed.
3. Under **Environment Variables**, add the same four variables from your `.env.local`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `QR_SIGNING_SECRET`.
4. Deploy. Every future push to `main` redeploys automatically.

## 5. Automate migrations with GitHub Actions (optional but recommended)

A workflow at `.github/workflows/supabase-migrations.yml` runs `supabase db push`
automatically whenever a push to `main` touches `supabase/migrations/` — so from now
on, adding a new migration file and pushing is enough; you don't need to paste it into
the SQL Editor yourself.

**Before turning this on, there's a required one-time step.** Supabase's CLI tracks
which migrations have already run in a table on your database. Since every migration
so far was applied by hand (pasted into the SQL Editor), Supabase has no record of them
— if you skip this step, the workflow's first run will try to re-run all 11 files from
scratch and fail with "already exists" errors.

### One-time setup (run these on your own machine, not in CI)

1. Install the Supabase CLI: `npm install -g supabase`
2. Log in: `supabase login` (opens a browser to authenticate)
3. Link this project: `supabase link --project-ref wcqqbbnwrekubywyndzl`
4. Mark all 11 already-applied migrations as done, without re-running them:
   ```bash
   supabase migration repair --status applied \
     20260701000001 20260701000002 20260701000003 20260701000004 \
     20260701000005 20260701000006 20260701000007 20260701000008 \
     20260701000009 20260701000010 20260701000011
   ```
5. Verify it worked: `supabase migration list` should show all 11 marked as applied
   both locally and remotely, with nothing pending.

### GitHub repo secrets (Settings > Secrets and variables > Actions)

| Secret | Where to get it |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Supabase dashboard → your account menu → **Account Preferences → Access Tokens** → generate one. This authenticates the CLI, not your database — treat it like a password. |
| `SUPABASE_PROJECT_REF` | The project ref from your dashboard URL — for this project, `wcqqbbnwrekubywyndzl` |
| `SUPABASE_DB_PASSWORD` | The database password set when the project was created. Forgot it? **Settings → Database → Reset database password** (this changes it, so update the secret too if you reset it) |

Once the one-time repair is done and the three secrets are set, every future migration
file you add and push will apply automatically — nothing further to configure.

```
app/
  login/                         sign-in page
  dashboard/                     role-based landing page after login
    attendance/                  teacher: scan/type a student ID to clock in or out
    attendance/register/         admin: today's attendance register
    fees/                        admin: record payments + recent list; student: own payment history
    fees/clearance/              teacher/admin: gate check — cleared/owing only, no amount shown
  api/
    id-card/                     current user's ID card + QR data URL
    attendance/clock-in/         student clock-in, WhatsApp to guardian
    attendance/clock-out/        student clock-out, checks guardian pass, WhatsApp
    guardian-passes/             create/list pickup passes
    teacher-attendance/          teacher self clock-in/out, WhatsApp to admins
    fee-structures/              admin sets expected fee per level/term
    fee-payments/                record a payment (generates receipt number), list history
    fee-payments/[id]/receipt/   receipt data for a single payment
    fee-clearance/[user_code]/   gate check — compares payments against fee_structures
    school-stamps/               generate/fetch the school's digital stamp (SVG)
    letters/                     compose a letter, rendered into a letterhead PDF
    score-sheets/                generate a blank score sheet PDF for a class/subject/term
lib/
  supabase/                      browser + server Supabase clients
  qr.ts                          QR token generation/verification
  notifications.ts               WhatsApp Cloud API integration (logs to console until configured)
middleware.ts                    keeps auth sessions refreshed, guards /dashboard
supabase/migrations/             schema + RLS policies, run these in the Supabase SQL editor
```

## WhatsApp setup (optional for local dev)

Attendance and teacher clock-in/out notifications go through Meta's WhatsApp Cloud API.
Without credentials, `lib/notifications.ts` just logs the message to the console instead
of failing — so you can test the full attendance flow locally before WhatsApp is set up.

To go live, add to your `.env.local` (and to Vercel's environment variables):
```
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
```
Getting these requires setting up a Meta Business app and WhatsApp Business number —
budget lead time for Meta's approval process; it isn't instant (see the cost estimate
doc's "biggest risks" section).

## Admitting students and adding teachers

After your first admin logs in, the order that actually works is:

1. **`/dashboard/academics`** — start an academic session (e.g. "2025/2026"); this
   auto-creates its 3 terms. Then add class arms (JSS1A, SSS2B, etc.) under it.
2. **`/dashboard/teachers`** — add teacher accounts.
3. **`/dashboard/students`** — admit students into a class arm.

Each of these creates a real login (email + the password you set in the form) alongside
the school record — the admin is responsible for sharing that password with the person,
since there's no invite-email flow yet. Unlike the original `/signup` flow (which is
self-service for a brand new school), these three are intentionally admin-only — a
teacher or student can't just show up and claim a role, someone with authority over the
school has to create the account.

## What's next (per the build-phase roadmap)

1. ~~Foundation~~ — auth, users, digital ID/QR, academic structure
2. ~~Attendance & time-tracking~~ — clock-in/out, WhatsApp, guardian pass, teacher self-clock
3. ~~Fees & clearance~~ — payment recording, receipts, gate clearance check
4. ~~Documents~~ — stamp generator, letter writer, score sheet generator
5. Exams & results (CBT, anti-cheat, flexible CA scoring, auto-recalculation, ranking)
6. E-learning (Google Meet integration, video/material uploads)

See the full system design doc for the database schema each of these phases needs —
the tables aren't in the migrations yet since they belong to their respective phases.

**Known gaps to flag:**
- Fee receipts (phase 3) still return JSON, not a PDF — now that this module's PDF
  pipeline (`lib/pdf.ts`, `lib/storage.ts`) exists, wiring receipts through it is a
  quick follow-up rather than new infrastructure.
- The stamp is a simple SVG (name + ring, no curved text/crest) — good enough to prove
  the pipeline, but a school will likely want a more elaborate design. It's also not
  yet embedded into the letter or score sheet PDFs — that wiring belongs with the
  Exams & Results phase, once result sheets (the main thing a stamp goes on) exist.
- Letterhead template selection in the letters UI isn't built yet (the API accepts a
  `template_id`, the form doesn't expose it) — first school-specific letterhead design
  needed before that's worth wiring up.
