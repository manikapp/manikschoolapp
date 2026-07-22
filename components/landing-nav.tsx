"use client";

import { useState } from "react";
import Link from "next/link";
import { SealIcon } from "./seal-icon";

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-ink/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <SealIcon className="h-7 w-7 text-brass" />
          <span className="font-display text-lg font-medium">ManikSchoolApp</span>
        </div>

        <nav className="hidden items-center gap-8 text-sm md:flex">
          <a href="#modules" className="hover:text-brass-dark">
            Modules
          </a>
          <a href="#how-it-works" className="hover:text-brass-dark">
            How it works
          </a>
          <Link href="/login" className="hover:text-brass-dark">
            Sign in
          </Link>
        </nav>

        <div className="hidden md:block">
          <Link
            href="/signup"
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-light"
          >
            Register your school
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-ink/15 md:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-ink/10 px-6 py-4 text-sm md:hidden">
          <a href="#modules" className="rounded-md px-2 py-2 hover:bg-ink/5" onClick={() => setOpen(false)}>
            Modules
          </a>
          <a href="#how-it-works" className="rounded-md px-2 py-2 hover:bg-ink/5" onClick={() => setOpen(false)}>
            How it works
          </a>
          <Link href="/login" className="rounded-md px-2 py-2 hover:bg-ink/5">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="mt-2 rounded-md bg-ink px-4 py-2 text-center font-medium text-paper"
          >
            Register your school
          </Link>
        </nav>
      )}
    </header>
  );
}
