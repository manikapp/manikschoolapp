"use client";

import { useEffect, useState } from "react";

type Teacher = {
  id: string;
  staff_number: string;
  department: string | null;
  users: { first_name: string; last_name: string; user_code: string };
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    staff_number: "",
    department: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function refresh() {
    fetch("/api/teachers")
      .then((r) => r.json())
      .then((d) => setTeachers(d.teachers ?? []));
  }

  useEffect(refresh, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();

    if (res.ok) {
      setSuccess(`Added — ID ${data.user_code}. Share the email and password you set so they can sign in.`);
      setForm({ first_name: "", last_name: "", email: "", password: "", staff_number: "", department: "" });
      refresh();
    } else {
      setError(data.error?.message ?? "Something went wrong");
    }
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-2xl px-8 py-10">
      <h1 className="font-display text-2xl font-medium">Add a teacher</h1>
      <p className="mt-1 text-sm text-ink/50">Creates their login and staff record together.</p>

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
            value={form.staff_number}
            onChange={(e) => setForm({ ...form, staff_number: e.target.value })}
            placeholder="Staff number"
            required
            className="rounded-md border border-ink/15 px-3 py-2 text-sm"
          />
          <input
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            placeholder="Department (optional)"
            className="rounded-md border border-ink/15 px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="mt-3 text-sm text-margin">{error}</p>}
        {success && <p className="mt-3 text-sm text-verdant">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-md bg-ink px-3 py-2 text-sm font-medium text-paper disabled:opacity-60"
        >
          {loading ? "Adding…" : "Add teacher"}
        </button>
      </form>

      <div className="mt-8 divide-y divide-ink/5 overflow-hidden rounded-lg border border-ink/10 bg-white">
        {teachers.map((t) => (
          <div key={t.id} className="flex items-center justify-between px-5 py-3 text-sm">
            <div>
              <p>
                {t.users.first_name} {t.users.last_name}
              </p>
              <p className="text-ink/40">
                {t.staff_number} {t.department ? `· ${t.department}` : ""}
              </p>
            </div>
            <span className="font-mono text-xs text-ink/50">{t.users.user_code}</span>
          </div>
        ))}
        {teachers.length === 0 && <p className="px-5 py-6 text-center text-sm text-ink/40">No teachers added yet.</p>}
      </div>
    </main>
  );
}
