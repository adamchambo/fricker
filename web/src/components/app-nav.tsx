"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { href: "/dashboard/friends", label: "Friends" },
  { href: "/dashboard/invites", label: "Invites" },
];

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function AppNav() {
  const pathname = usePathname();

  async function logout() {
    try {
      await signOut(getFirebaseAuth());
    } catch {
      /* ignore */
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-5 gap-y-4 px-6 py-4 md:gap-x-8 md:px-8 md:py-5">
        <Link href="/dashboard/swipe" className="group flex shrink-0 flex-col leading-none">
          <span className="font-display text-xl tracking-tight text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
            fricker
          </span>
          <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Friend picker
          </span>
        </Link>

        <nav
          className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-2 md:justify-end md:gap-3"
          aria-label="Primary"
        >
          {navLinks.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-3.5 py-2 font-sans text-xs font-semibold uppercase tracking-wide transition-[background-color,color] duration-200 ${
                  active
                    ? "bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--foreground)]"
                    : "text-[var(--muted)] hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] hover:text-[var(--foreground)]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <span className="hidden h-5 w-px shrink-0 bg-[var(--border)] md:block" aria-hidden />
          <Link
            href="/dashboard/swipe"
            className={`hangout-btn-primary inline-flex shrink-0 items-center justify-center rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wide shadow-none ${
              pathname === "/dashboard/swipe" ? "ring-2 ring-[color-mix(in_srgb,var(--accent-contrast)_35%,transparent)] ring-offset-2 ring-offset-[var(--background)]" : ""
            }`}
          >
            Swipe
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-3 md:gap-4">
          <Link
            href="/dashboard/profile"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-[background-color,color,border-color] duration-200 ${
              pathname === "/dashboard/profile"
                ? "border-[color-mix(in_srgb,var(--accent)_45%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--foreground)]"
                : "border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:border-[color-mix(in_srgb,var(--foreground)_18%,var(--border))] hover:text-[var(--foreground)]"
            }`}
            aria-label="Profile"
            title="Profile"
          >
            <ProfileIcon />
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="hangout-btn-ghost px-4 py-2 text-xs font-semibold uppercase tracking-wide"
          >
            Log out
          </button>
        </div>

        <div className="ml-auto flex shrink-0 items-center border-l border-[var(--border)] pl-4 md:pl-5">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
