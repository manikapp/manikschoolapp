"use client";

import { useState } from "react";

type CheckResult = { code: string; status: "cleared" | "owing" | "error"; name?: string; message?: string };

export default function ClearanceChecker() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CheckResult[]>([]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);

    const res = await fetch(`/api/fee-clearance/${encodeURIComponent(code.trim())}`);
    const data = await res.json();

    setResults((prev) => [
      res.ok
        ? { code: code.trim(), status: data.status, name: data.student_name }
        : { code: code.trim(), status: "error", message: data.error?.message },
      ...prev
    ]);
    setCode("");
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-black/10 bg-white p-6">
      <form onSubmit={submit} className="mb-6 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Scan QR or type admission number"
          className="flex-1 rounded-md border border-black/15 px-3 py-2 text-sm"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "…" : "Check"}
        </button>
      </form>

      <div className="divide-y divide-black/10">
        {results.length === 0 && <p className="py-3 text-sm text-black/40">No checks yet.</p>}
        {results.map((r, i) => (
          <div key={i} className="flex items-center justify-between py-3 text-sm">
            <span>{r.name ?? r.code}</span>
            <span
              className={
                r.status === "cleared"
                  ? "rounded-md bg-emerald-50 px-2 py-1 text-emerald-700"
                  : r.status === "owing"
                    ? "rounded-md bg-amber-50 px-2 py-1 text-amber-700"
                    : "text-red-600"
              }
            >
              {r.status === "cleared" ? "Cleared" : r.status === "owing" ? "Fee owing" : r.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
