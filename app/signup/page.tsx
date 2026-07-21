"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [schoolName, setSchoolName] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");
  const [schoolPhone, setSchoolPhone] = useState("");
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/register-school", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        school_name: schoolName,
        school_address: schoolAddress,
        school_phone: schoolPhone,
        school_email: adminEmail,
        admin_first_name: adminFirstName,
        admin_last_name: adminLastName,
        admin_email: adminEmail,
        admin_password: adminPassword
      })
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error?.message ?? "Something went wrong");
      setLoading(false);
      return;
    }

    // Registration succeeded — sign in immediately rather than sending them
    // back to /login to re-enter what they just typed.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });

    if (signInError) {
      // Account exists but auto-login failed for some reason — not fatal,
      // they can still log in manually with what they just set.
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-black/10 bg-white p-8 shadow-sm"
      >
        <h1 className="mb-1 text-xl font-medium">Register your school</h1>
        <p className="mb-6 text-sm text-black/60">
          Creates your school and your admin account in one step.
        </p>

        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-black/40">School</p>
        <input
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          placeholder="School name"
          required
          className="mb-3 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
        />
        <input
          value={schoolAddress}
          onChange={(e) => setSchoolAddress(e.target.value)}
          placeholder="Address"
          className="mb-3 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
        />
        <input
          value={schoolPhone}
          onChange={(e) => setSchoolPhone(e.target.value)}
          placeholder="Phone"
          className="mb-5 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
        />

        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-black/40">Your admin account</p>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <input
            value={adminFirstName}
            onChange={(e) => setAdminFirstName(e.target.value)}
            placeholder="First name"
            required
            className="rounded-md border border-black/15 px-3 py-2 text-sm"
          />
          <input
            value={adminLastName}
            onChange={(e) => setAdminLastName(e.target.value)}
            placeholder="Last name"
            required
            className="rounded-md border border-black/15 px-3 py-2 text-sm"
          />
        </div>
        <input
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          type="email"
          placeholder="Email"
          required
          className="mb-3 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
        />
        <input
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          type="password"
          placeholder="Password"
          required
          minLength={6}
          className="mb-5 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
        />

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Creating your school…" : "Create school and sign in"}
        </button>

        <p className="mt-4 text-center text-sm text-black/50">
          Already have an account?{" "}
          <a href="/login" className="text-accent underline">
            Sign in
          </a>
        </p>
      </form>
    </main>
  );
}
