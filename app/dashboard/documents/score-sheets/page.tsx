"use client";

import { useEffect, useState } from "react";

type Sheet = {
  id: string;
  pdf_url: string;
  class_arms: { display_name: string } | null;
  subjects: { name: string } | null;
  terms: { name: string } | null;
};

export default function ScoreSheetsPage() {
  const [classArmId, setClassArmId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [termId, setTermId] = useState("");
  const [loading, setLoading] = useState(false);
  const [sheets, setSheets] = useState<Sheet[]>([]);

  function refresh() {
    fetch("/api/score-sheets")
      .then((r) => r.json())
      .then((d) => setSheets(d.score_sheets ?? []));
  }

  useEffect(refresh, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/score-sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ class_arm_id: classArmId, subject_id: subjectId, term_id: termId })
    });
    if (res.ok) {
      setClassArmId("");
      setSubjectId("");
      setTermId("");
      refresh();
    }
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-4 text-lg font-medium">Score sheets</h1>

      <form onSubmit={submit} className="rounded-xl border border-black/10 bg-white p-6">
        <div className="mb-3 grid grid-cols-3 gap-3">
          <input
            value={classArmId}
            onChange={(e) => setClassArmId(e.target.value)}
            placeholder="Class arm ID"
            required
            className="rounded-md border border-black/15 px-3 py-2 text-sm"
          />
          <input
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            placeholder="Subject ID"
            required
            className="rounded-md border border-black/15 px-3 py-2 text-sm"
          />
          <input
            value={termId}
            onChange={(e) => setTermId(e.target.value)}
            placeholder="Term ID"
            required
            className="rounded-md border border-black/15 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brass px-3 py-2 text-sm font-medium text-paper disabled:opacity-60"
        >
          {loading ? "Generating PDF…" : "Generate score sheet"}
        </button>
        <p className="mt-2 text-xs text-black/40">
          Default columns are CA1/CA2/CA3/Exam/Total — configurable templates are a
          natural next iteration once a school wants a different breakdown.
        </p>
      </form>

      <div className="mt-6 divide-y divide-black/5 overflow-hidden rounded-xl border border-black/10 bg-white">
        {sheets.map((s) => (
          <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>
              {s.subjects?.name} · {s.class_arms?.display_name} · {s.terms?.name}
            </span>
            <a href={s.pdf_url} target="_blank" rel="noreferrer" className="text-brass underline">
              Download
            </a>
          </div>
        ))}
        {sheets.length === 0 && <p className="px-4 py-6 text-center text-sm text-black/40">No score sheets yet.</p>}
      </div>
    </main>
  );
}
