"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SealIcon } from "@/components/seal-icon";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 text-ink">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-ink/10 bg-white p-8 shadow-sm"
      >
        <SealIcon className="mb-4 h-7 w-7 text-brass" />
        <h1 className="mb-1 font-display text-xl font-medium">ManikSchoolApp</h1>
        <p className="mb-6 text-sm text-ink/60">Sign in to your dashboard</p>

        <label className="mb-1 block text-sm text-ink/70">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@school.edu.ng"
          className="mb-4 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
        />

        <label className="mb-1 block text-sm text-ink/70">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
        />

        {error && <p className="mb-4 text-sm text-margin">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-ink px-3 py-2 text-sm font-medium text-paper disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p className="mt-4 text-center text-sm text-ink/50">
          New school?{" "}
          <a href="/signup" className="text-brass-dark underline">
            Register here
          </a>
        </p>
      </form>
    </main>
  );
}
