"use client";

import { useEffect, useState } from "react";

type ClassArm = { id: string; display_name: string };
type Student = {
  id: string;
  admission_number: string;
  users: { first_name: string; last_name: string; email: string; user_code: string };
  class_arms: { display_name: string } | null;
};

export default function StudentsPage() {
  const [classArms, setClassArms] = useState<ClassArm[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    admission_number: "",
    class_arm_id: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function refresh() {
    fetch("/api/class-arms")
      .then((r) => r.json())
      .then((d) => setClassArms(d.class_arms ?? []));
    fetch("/api/students")
      .then((r) => r.json())
      .then((d) => setStudents(d.students ?? []));
  }

  useEffect(refresh, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();

    if (res.ok) {
      setSuccess(`Admitted — ID ${data.user_code}. Share the email and password you set so they can sign in.`);
      setForm({ first_name: "", last_name: "", email: "", password: "", admission_number: "", class_arm_id: form.class_arm_id });
      refresh();
    } else {
      setError(data.error?.message ?? "Something went wrong");
    }
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-2xl px-8 py-10">
      <h1 className="font-display text-2xl font-medium">Admit a student</h1>
      <p className="mt-1 text-sm text-ink/50">Creates their login and their school record together.</p>

      {classArms.length === 0 ? (
        <p className="mt-6 rounded-lg border border-margin/20 bg-margin/5 p-4 text-sm text-margin">
          No class arms yet — set one up on the{" "}
          <a href="/dashboard/academics" className="underline">
            Academic setup
          </a>{" "}
          page first.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 rounded-lg border border-ink/10 bg-white p-5">
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              placeholder="First name"
              required
              className="rounded-md border border-ink/15 px-3 py-2 text-sm"
            />
            <input
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              placeholder="Last name"
              required
              className="rounded-md border border-ink/15 px-3 py-2 text-sm"
            />
          </div>
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            type="email"
            placeholder="Email"
            required
            className="mt-3 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
          />
          <input
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            type="text"
            placeholder="Initial password (share this with them)"
            required
            minLength={6}
            className="mt-3 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
          />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <input
              value={form.admission_number}
              onChange={(e) => setForm({ ...form, admission_number: e.target.value })}
              placeholder="Admission number"
              required
              className="rounded-md border border-ink/15 px-3 py-2 text-sm"
            />
            <select
              value={form.class_arm_id}
              onChange={(e) => setForm({ ...form, class_arm_id: e.target.value })}
              required
              className="rounded-md border border-ink/15 px-3 py-2 text-sm"
            >
              <option value="">Class arm</option>
              {classArms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="mt-3 text-sm text-margin">{error}</p>}
          {success && <p className="mt-3 text-sm text-verdant">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-md bg-ink px-3 py-2 text-sm font-medium text-paper disabled:opacity-60"
          >
            {loading ? "Admitting…" : "Admit student"}
          </button>
        </form>
      )}

      <div className="mt-8 divide-y divide-ink/5 overflow-hidden rounded-lg border border-ink/10 bg-white">
        {students.map((s) => (
          <div key={s.id} className="flex items-center justify-between px-5 py-3 text-sm">
            <div>
              <p>
                {s.users.first_name} {s.users.last_name}
              </p>
              <p className="text-ink/40">
                {s.admission_number} · {s.class_arms?.display_name ?? "No class"}
              </p>
            </div>
            <span className="font-mono text-xs text-ink/50">{s.users.user_code}</span>
          </div>
        ))}
        {students.length === 0 && <p className="px-5 py-6 text-center text-sm text-ink/40">No students admitted yet.</p>}
      </div>
    </main>
  );
}
