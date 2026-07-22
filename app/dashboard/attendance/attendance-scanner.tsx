"use client";

import { useState } from "react";

type ScanResult = {
  studentCode: string;
  action: "clock-in" | "clock-out";
  message: string;
  ok: boolean;
};

export default function AttendanceScanner() {
  const [mode, setMode] = useState<"clock-in" | "clock-out">("clock-in");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<ScanResult[]>([]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);

    const endpoint = mode === "clock-in" ? "/api/attendance/clock-in" : "/api/attendance/clock-out";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_code: code.trim() })
    });
    const data = await res.json();

    setRecent((prev) => [
      {
        studentCode: code.trim(),
        action: mode,
        ok: res.ok,
        message: res.ok
          ? mode === "clock-in"
            ? "Clocked in"
            : data.picked_up_via_guardian_pass
              ? `Clocked out — picked up by ${data.picked_up_via_guardian_pass.name}`
              : "Clocked out"
          : data.error?.message ?? "Something went wrong"
      },
      ...prev
    ]);
    setCode("");
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-black/10 bg-white p-6">
      <div className="mb-3 flex gap-2">
        <button
          onClick={() => setMode("clock-in")}
          className={`flex-1 rounded-md border px-3 py-2 text-sm ${
            mode === "clock-in" ? "border-brass bg-brass/10 text-brass" : "border-black/15"
          }`}
        >
          Clock in
        </button>
        <button
          onClick={() => setMode("clock-out")}
          className={`flex-1 rounded-md border px-3 py-2 text-sm ${
            mode === "clock-out" ? "border-brass bg-brass/10 text-brass" : "border-black/15"
          }`}
        >
          Clock out
        </button>
      </div>

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
          className="rounded-md bg-brass px-4 py-2 text-sm font-medium text-paper disabled:opacity-60"
        >
          {loading ? "…" : "Submit"}
        </button>
      </form>

      <p className="mb-2 text-sm font-medium">Recent scans</p>
      <div className="divide-y divide-black/10">
        {recent.length === 0 && <p className="py-3 text-sm text-black/40">No scans yet.</p>}
        {recent.map((r, i) => (
          <div key={i} className="flex items-center justify-between py-2 text-sm">
            <span>{r.studentCode}</span>
            <span className={r.ok ? "text-emerald-700" : "text-red-600"}>{r.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
