"use client";

import { useEffect, useState } from "react";

export default function StampPage() {
  const [stampUrl, setStampUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/school-stamps")
      .then((r) => r.json())
      .then((d) => setStampUrl(d.school_stamp?.image_url ?? null));
  }, []);

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/school-stamps", { method: "POST" });
    const data = await res.json();
    if (res.ok) setStampUrl(data.school_stamp.image_url);
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-4 text-lg font-medium">School stamp</h1>
      <div className="rounded-xl border border-black/10 bg-white p-6 text-center">
        {stampUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={stampUrl} alt="School stamp" className="mx-auto h-48 w-48" />
        ) : (
          <p className="py-12 text-sm text-black/40">No stamp generated yet.</p>
        )}
        <button
          onClick={generate}
          disabled={loading}
          className="mt-6 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Generating…" : stampUrl ? "Regenerate stamp" : "Generate stamp"}
        </button>
      </div>
    </main>
  );
}
