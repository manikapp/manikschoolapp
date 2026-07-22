"use client";

import { useEffect, useState } from "react";

type School = {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
  student_count: number;
  teacher_count: number;
};

export default function PlatformSchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/platform/schools")
      .then((r) => r.json())
      .then((d) => {
        setSchools(d.schools ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="font-display text-2xl font-medium">Schools</h1>
      <p className="mt-1 text-sm text-ink/50">Every school registered on the platform.</p>

      <div className="mt-6 divide-y divide-ink/5 overflow-hidden rounded-lg border border-ink/10 bg-white">
        {loading && <p className="px-5 py-6 text-center text-sm text-ink/40">Loading…</p>}
        {!loading &&
          schools.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-4 text-sm">
              <div>
                <p className="font-display font-medium">{s.name}</p>
                <p className="text-ink/40">{s.address ?? "No address on file"}</p>
              </div>
              <div className="flex gap-4 text-right">
                <div>
                  <p className="font-mono">{s.student_count}</p>
                  <p className="text-xs text-ink/40">students</p>
                </div>
                <div>
                  <p className="font-mono">{s.teacher_count}</p>
                  <p className="text-xs text-ink/40">teachers</p>
                </div>
              </div>
            </div>
          ))}
        {!loading && schools.length === 0 && (
          <p className="px-5 py-6 text-center text-sm text-ink/40">No schools registered yet.</p>
        )}
      </div>
    </main>
  );
}
