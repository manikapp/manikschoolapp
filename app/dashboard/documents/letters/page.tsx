"use client";

import { useEffect, useState } from "react";

type Letter = { id: string; title: string; recipient: string | null; pdf_url: string; created_at: string };

export default function LettersPage() {
  const [title, setTitle] = useState("");
  const [recipient, setRecipient] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [letters, setLetters] = useState<Letter[]>([]);

  function refresh() {
    fetch("/api/letters")
      .then((r) => r.json())
      .then((d) => setLetters(d.letters ?? []));
  }

  useEffect(refresh, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/letters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, recipient, body })
    });
    if (res.ok) {
      setTitle("");
      setRecipient("");
      setBody("");
      refresh();
    }
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-4 text-lg font-medium">Letters</h1>

      <form onSubmit={submit} className="rounded-xl border border-black/10 bg-white p-6">
        <div className="mb-3 grid gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Letter title (e.g. Notice of resumption)"
            required
            className="rounded-md border border-black/15 px-3 py-2 text-sm"
          />
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Recipient (e.g. All parents and guardians)"
            className="rounded-md border border-black/15 px-3 py-2 text-sm"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Letter body"
            required
            rows={6}
            className="rounded-md border border-black/15 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Generating PDF…" : "Create letter"}
        </button>
      </form>

      <div className="mt-6 divide-y divide-black/5 overflow-hidden rounded-xl border border-black/10 bg-white">
        {letters.map((l) => (
          <div key={l.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p>{l.title}</p>
              <p className="text-black/40">{l.recipient}</p>
            </div>
            <a href={l.pdf_url} target="_blank" rel="noreferrer" className="text-accent underline">
              Download
            </a>
          </div>
        ))}
        {letters.length === 0 && <p className="px-4 py-6 text-center text-sm text-black/40">No letters yet.</p>}
      </div>
    </main>
  );
}
