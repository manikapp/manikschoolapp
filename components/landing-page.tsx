import Link from "next/link";
import { SealIcon } from "./seal-icon";
import { LandingNav } from "./landing-nav";

const MODULES = [
  {
    icon: "M12 4a2 2 0 100 4 2 2 0 000-4zM6 20a6 6 0 0112 0",
    title: "Digital ID and QR",
    body: "Every student, teacher, and admin gets a scannable ID that unlocks their dashboard."
  },
  {
    icon: "M12 8v4l3 3M12 3a9 9 0 100 18 9 9 0 000-18z",
    title: "Attendance and WhatsApp",
    body: "Scan a student in or out and their guardian gets a WhatsApp message immediately."
  },
  {
    icon: "M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    title: "CBT exams with anti-cheat",
    body: "Build exams for print or computer, with tab-switch detection during live sessions."
  },
  {
    icon: "M4 6h16M4 12h10M4 18h7",
    title: "Auto-ranked results",
    body: "Scores recalculate the moment a teacher enters one — positions update for the whole class."
  },
  {
    icon: "M3 10h18M7 15h4M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z",
    title: "Fees and gate clearance",
    body: "Record payments once, and the gate scanner knows instantly who's cleared."
  },
  {
    icon: "M9 4h6l3 3v13H6V7z",
    title: "Documents and stamps",
    body: "Generate a school stamp, write a letter on your letterhead, or print a score sheet."
  }
];

const STEPS = [
  { title: "Register your school", body: "Create your school and admin account in under a minute." },
  { title: "Add teachers and students", body: "Onboard your staff and class arms, JSS1 through SSS3." },
  { title: "Run your term", body: "Attendance, exams, results, and fees, all in one place from day one." }
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <LandingNav />

      <section className="ruled-paper border-b border-ink/10">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-widest text-margin">
              Built for Nigerian secondary schools
            </p>
            <h1 className="font-display text-4xl font-medium leading-tight sm:text-5xl">
              Every term, every score, every gate — accounted for.
            </h1>
            <p className="mt-5 max-w-md text-base text-ink/70">
              One platform for attendance, exams, results, fees, and documents — built
              around JSS1 to SSS3, three terms a year, and the way your school actually runs.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-md bg-ink px-5 py-3 text-sm font-medium text-paper hover:bg-ink-light"
              >
                Register your school
              </Link>
              <a
                href="#modules"
                className="rounded-md border border-ink/20 px-5 py-3 text-sm font-medium hover:border-ink"
              >
                See what's included
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-2">
              {["JSS1 – SSS3", "3 terms a year", "WAEC-style grading", "WhatsApp built in"].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-ink/15 bg-paper px-3 py-1 text-xs font-medium text-ink/70"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="relative flex justify-center">
            <div className="w-full max-w-sm rounded-lg border border-ink/15 bg-white p-6 shadow-sm">
              <p className="font-display text-sm font-medium">Greenfield High School</p>
              <p className="mb-4 text-xs text-ink/50">Term 1 report · SSS2 Science B</p>
              <table className="w-full font-mono text-xs">
                <tbody>
                  <tr className="border-b border-ink/10">
                    <td className="py-2">Chemistry</td>
                    <td className="py-2 text-right">82</td>
                    <td className="py-2 pl-3 text-right text-verdant">2nd</td>
                  </tr>
                  <tr className="border-b border-ink/10">
                    <td className="py-2">Biology</td>
                    <td className="py-2 text-right">74</td>
                    <td className="py-2 pl-3 text-right text-ink/50">5th</td>
                  </tr>
                  <tr>
                    <td className="py-2">Further maths</td>
                    <td className="py-2 text-right">81</td>
                    <td className="py-2 pl-3 text-right text-verdant">2nd</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="animate-stamp absolute -right-2 -top-2 flex h-24 w-24 rotate-[-6deg] items-center justify-center rounded-full border-2 border-brass bg-paper text-brass shadow-sm">
              <SealIcon className="h-10 w-10" />
            </div>
          </div>
        </div>
      </section>

      <section id="modules" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-2xl font-medium">Everything your school office already does — digitized</h2>
        <p className="mt-2 max-w-xl text-ink/60">
          Not a generic dashboard — each module matches a real part of how a Nigerian
          secondary school runs day to day.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <div key={m.title} className="rounded-lg border border-ink/10 bg-white p-5 hover:border-ink/30">
              <svg viewBox="0 0 24 24" fill="none" className="mb-3 h-6 w-6 text-brass">
                <path d={m.icon} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="font-display text-base font-medium">{m.title}</p>
              <p className="mt-1 text-sm text-ink/60">{m.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="border-y border-ink/10 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-2xl font-medium">Three steps to your first term</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title}>
                <p className="font-mono text-sm text-brass">{String(i + 1).padStart(2, "0")}</p>
                <p className="mt-2 font-display text-lg font-medium">{step.title}</p>
                <p className="mt-1 text-sm text-ink/60">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-ink text-paper/70">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-12 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <SealIcon className="h-6 w-6 text-brass" />
            <span className="font-display text-base font-medium text-paper">ManikSchoolApp</span>
          </div>
          <p className="text-sm">Digital school management for Nigerian secondary schools.</p>
        </div>
      </footer>
    </div>
  );
}
