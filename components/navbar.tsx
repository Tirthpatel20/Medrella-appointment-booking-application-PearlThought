"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function Navbar() {
  const { data: session, isPending } = authClient.useSession();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      const result = await authClient.signOut();

      if (result.error) {
        setLoggingOut(false);
        return;
      }

      window.location.href = "/";
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <nav className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-lg font-bold text-white">
            M
          </span>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Medrella<span className="text-teal-700">.</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link href="/#how-it-works" className="text-sm text-slate-600 transition hover:text-teal-700">
            How it works
          </Link>
          <Link href="/#for-doctors" className="text-sm text-slate-600 transition hover:text-teal-700">
            For doctors
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {isPending ? (
            <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-100" />
          ) : session ? (
            <>
              <span className="hidden max-w-32 truncate text-sm text-slate-600 sm:block">
                Hi, {session.user.name.split(" ")[0]}
              </span>
              {session.user.role === "doctor" ? (
                <Link
                  href="/doctor/dashboard"
                  className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/#how-it-works"
                  className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
                >
                  Find care
                </Link>
              )}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                {loggingOut ? "Signing out..." : "Log out"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth"
                className="px-2 py-2 text-sm font-semibold text-slate-700 transition hover:text-teal-700"
              >
                Sign in
              </Link>
              <Link
                href="/auth"
                className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}