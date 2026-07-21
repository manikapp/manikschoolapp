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
2. In the SQL Editor, run the two migration files in order:
   - `supabase/migrations/0001_foundation_schema.sql`
   - `supabase/migrations/0002_rls_policies.sql`
3. Go to **Settings > API** and copy your **Project URL** and **anon public key**.
4. Go to **Authentication > Providers** and make sure Email is enabled.

### Creating your first school + admin user

Supabase Auth creates rows in `auth.users`, not your `public.users` table — you need
both. After signing up a user via Supabase Auth (dashboard, or your own sign-up flow
once you build one), insert their profile row manually to get started:

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

A proper "admin creates a user" flow (`POST /users` from the API reference doc) is the
next thing to build on top of this scaffold — this manual step is just to get your
first login working.

## 2. Run locally

```bash
npm install
cp .env.example .env.local
# fill in .env.local with your Supabase URL/anon key and a random QR_SIGNING_SECRET
npm run dev
```

Visit `http://localhost:3000` — it'll redirect to `/login`.

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Foundation phase: auth, users, academic structure"
git branch -M main
git remote add origin https://github.com/<your-username>/school-sleek.git
git push -u origin main
```

(Create the empty repo on GitHub first, via github.com's "New repository" button —
don't initialize it with a README so the push above doesn't conflict.)

## 4. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo you just pushed.
2. Vercel will auto-detect Next.js — no build config changes needed.
3. Under **Environment Variables**, add the same three variables from your `.env.local`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `QR_SIGNING_SECRET`.
4. Deploy. Every future push to `main` redeploys automatically.

## Project structure

```
app/
  login/             sign-in page
  dashboard/          role-based landing page after login
  api/id-card/        returns the current user's ID card + QR data URL
lib/
  supabase/            browser + server Supabase clients
  qr.ts                QR token generation/verification
middleware.ts          keeps auth sessions refreshed, guards /dashboard
supabase/migrations/    schema + RLS policies, run these in the Supabase SQL editor
```

## What's next (per the build-phase roadmap)

1. ~~Foundation~~ — this scaffold
2. Attendance & time-tracking (clock-in/out, WhatsApp notifications, guardian pass)
3. Fees & clearance
4. Documents (stamp/letterhead/score sheet generators)
5. Exams & results (CBT, anti-cheat, flexible CA scoring, auto-recalculation, ranking)
6. E-learning (Google Meet integration, video/material uploads)

See the full system design doc for the database schema each of these phases needs —
the tables aren't in this migration yet since they belong to their respective phases.
