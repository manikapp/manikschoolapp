"use client";

import { useEffect, useState } from "react";

type Term = { id: string; name: string; is_current: boolean };
type Session = { id: string; name: string; is_current: boolean; terms: Term[] };
type ClassArm = { id: string; display_name: string; level: string };

const LEVELS = ["jss1", "jss2", "jss3", "sss1", "sss2", "sss3"];

export default function AcademicsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [classArms, setClassArms] = useState<ClassArm[]>([]);
  const [sessionName, setSessionName] = useState("");
  const [level, setLevel] = useState("jss1");
  const [armName, setArmName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    fetch("/api/academic-sessions")
      .then((r) => r.json())
      .then((d) => setSessions(d.academic_sessions ?? []));
    fetch("/api/class-arms")
      .then((r) => r.json())
      .then((d) => setClassArms(d.class_arms ?? []));
  }

  useEffect(refresh, []);

  const currentSession = sessions.find((s) => s.is_current);

  async function createSession(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/academic-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: sessionName })
    });
    const data = await res.json();
    if (res.ok) {
      setSessionName("");
      refresh();
    } else {
      setError(data.error?.message ?? "Something went wrong");
    }
    setLoading(false);
  }

  async function createClassArm(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/class-arms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, arm_name: armName })
    });
    const data = await res.json();
    if (res.ok) {
      setArmName("");
      refresh();
    } else {
      setError(data.error?.message ?? "Something went wrong");
    }
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-2xl px-8 py-10">
      <h1 className="font-display text-2xl font-medium">Academic setup</h1>
      <p className="mt-1 text-sm text-ink/50">
        Set up your session and class arms before admitting students.
      </p>

      {error && <p className="mt-4 text-sm text-margin">{error}</p>}

      <div className="mt-6 rounded-lg border border-ink/10 bg-white p-5">
        <p className="mb-3 text-sm font-medium">Academic session</p>
        {currentSession ? (
          <div>
            <p className="font-display text-lg font-medium">{currentSession.name}</p>
            <div className="mt-2 flex gap-2">
              {currentSession.terms
                ?.sort((a, b) => a.name.localeCompare(b.name))
                .map((t) => (
                  <span
                    key={t.id}
                    className={`rounded-full px-3 py-1 text-xs capitalize ${
                      t.is_current ? "bg-verdant/10 text-verdant" : "bg-ink/5 text-ink/50"
                    }`}
                  >
                    {t.name} term{t.is_current ? " · current" : ""}
                  </span>
                ))}
            </div>
          </div>
        ) : (
          <form onSubmit={createSession} className="flex gap-2">
            <input
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="e.g. 2025/2026"
              required
              className="flex-1 rounded-md border border-ink/15 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-60"
            >
              Start session
            </button>
          </form>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-ink/10 bg-white p-5">
        <p className="mb-3 text-sm font-medium">Class arms</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {classArms.map((c) => (
            <span key={c.id} className="rounded-full bg-ink/5 px-3 py-1 font-mono text-xs">
              {c.display_name}
            </span>
          ))}
          {classArms.length === 0 && <p className="text-sm text-ink/40">No class arms yet.</p>}
        </div>
        {currentSession && (
          <form onSubmit={createClassArm} className="flex gap-2">
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="rounded-md border border-ink/15 px-3 py-2 text-sm">
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </select>
            <input
              value={armName}
              onChange={(e) => setArmName(e.target.value)}
              placeholder="Arm, e.g. A"
              required
              maxLength={12}
              className="w-28 rounded-md border border-ink/15 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-60"
            >
              Add arm
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
