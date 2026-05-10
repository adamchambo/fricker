"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/friends", label: "Friends" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/swipe", label: "Swipe" },
  { href: "/dashboard/invites", label: "Invites" },
  { href: "/dashboard/history", label: "History" },
  { href: "/dashboard/saved", label: "Saved" },
];

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
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <Link href="/dashboard" className="group flex flex-col leading-none">
          <span className="font-display text-xl tracking-tight text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
            fricker
          </span>
          <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Friend picker
          </span>
        </Link>

        <nav className="flex flex-1 flex-wrap items-center justify-center gap-1 md:justify-end md:gap-1.5" aria-label="Primary">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-3 py-1.5 font-sans text-xs font-semibold uppercase tracking-wide transition-[background-color,color] duration-200 ${
                  active
                    ? "bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--foreground)]"
                    : "text-[var(--muted)] hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] hover:text-[var(--foreground)]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => void logout()}
            className="hangout-btn-ghost px-4 py-2 text-xs font-semibold uppercase tracking-wide"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
