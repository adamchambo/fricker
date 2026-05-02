"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-8 px-5 py-16">
      <div className="pointer-events-none absolute inset-x-0 top-24 mx-auto h-48 max-w-md rounded-[2.5rem] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] blur-3xl" aria-hidden />

      <div className="relative">
        <p className="hangout-eyebrow">Welcome back</p>
        <h1 className="font-display mt-3 text-4xl tracking-tight text-[var(--foreground)] md:text-[2.75rem]">Log in</h1>
        <p className="mt-3 max-w-md font-sans text-[var(--muted)] leading-relaxed">
          Sign in to fricker — your friend list, invites, and picks stay on your account only.
        </p>
      </div>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="hangout-card relative flex flex-col gap-5 p-8 md:p-10"
      >
        <label className="flex flex-col gap-2 font-sans text-sm font-medium text-[var(--foreground)]">
          <span className="text-[var(--muted)]">Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="hangout-input"
          />
        </label>
        <label className="flex flex-col gap-2 font-sans text-sm font-medium text-[var(--foreground)]">
          <span className="text-[var(--muted)]">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="hangout-input"
          />
        </label>
        {error ? (
          <p className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={loading} className="hangout-btn-primary mt-1 w-full">
          {loading ? "Signing in…" : "Continue"}
        </button>
      </form>

      <p className="text-center font-sans text-sm text-[var(--muted)]">
        No account?{" "}
        <Link href="/register" className="hangout-link">
          Register
        </Link>
      </p>
    </div>
  );
}
