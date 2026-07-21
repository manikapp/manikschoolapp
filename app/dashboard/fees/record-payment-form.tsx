"use client";

import { useState } from "react";

export default function RecordPaymentForm() {
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [termId, setTermId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/fee-payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: studentId, amount: Number(amount), description, term_id: termId })
    });
    const data = await res.json();

    if (res.ok) {
      setMessage(`Recorded — receipt ${data.fee_payment.receipt_number}`);
      setAmount("");
      setDescription("");
    } else {
      setMessage(data.error?.message ?? "Something went wrong");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-black/10 bg-white p-6">
      <p className="mb-4 text-sm font-medium">Record a payment</p>
      <div className="mb-3 grid grid-cols-1 gap-3">
        <input
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="Student ID (uuid)"
          required
          className="rounded-md border border-black/15 px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (₦)"
            type="number"
            required
            className="rounded-md border border-black/15 px-3 py-2 text-sm"
          />
          <input
            value={termId}
            onChange={(e) => setTermId(e.target.value)}
            placeholder="Term ID (uuid)"
            required
            className="rounded-md border border-black/15 px-3 py-2 text-sm"
          />
        </div>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (e.g. Term 1 school fees)"
          required
          className="rounded-md border border-black/15 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Recording…" : "Record payment"}
      </button>
      {message && <p className="mt-3 text-sm text-black/70">{message}</p>}
      <p className="mt-3 text-xs text-black/40">
        Looking up a student's ID/term ID by name is a UI convenience worth adding next —
        this v1 form takes the raw IDs to keep the scaffold focused on the data flow.
      </p>
    </form>
  );
}
