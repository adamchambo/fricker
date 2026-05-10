"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { useState } from "react";
import { ApiError, apiFetch } from "@/lib/api-client";
import { getFirebaseAuth } from "@/lib/firebase";

const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const u = username.trim();
    const dn = displayName.trim();
    if (u.length < 3 || u.length > 24) {
      setError("Username must be 3–24 characters.");
      return;
    }
    if (!USERNAME_RE.test(u)) {
      setError("Username may only contain letters, numbers, and underscore.");
      return;
    }
    if (dn.length < 1 || dn.length > 80) {
      setError("Display name must be 1–80 characters.");
      return;
    }
    setLoading(true);
    const auth = getFirebaseAuth();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      try {
        await apiFetch("/api/profile/public", {
          method: "POST",
          body: JSON.stringify({ username: u, displayName: dn }),
        });
      } catch (profileErr: unknown) {
        await signOut(auth);
        setError(
          profileErr instanceof ApiError
            ? profileErr.message
            : profileErr instanceof Error
              ? profileErr.message
              : "Could not save profile. Try again.",
        );
        return;
      }
      router.replace("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-8 px-5 py-16">
      <div className="pointer-events-none absolute inset-x-0 bottom-32 mx-auto h-52 max-w-lg rounded-[3rem] bg-[color-mix(in_srgb,var(--accent)_11%,transparent)] blur-3xl" aria-hidden />

      <div className="relative">
        <p className="hangout-eyebrow">New here</p>
        <h1 className="font-display mt-3 text-4xl tracking-tight text-[var(--foreground)] md:text-[2.75rem]">Create account</h1>
        <p className="mt-3 max-w-md font-sans text-[var(--muted)] leading-relaxed">
          fricker keeps a minimal public profile for @username search; your hangout prefs stay private until you&apos;re friends.
        </p>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="hangout-card relative flex flex-col gap-5 p-8 md:p-10">
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
          <span className="text-[var(--muted)]">Username</span>
          <input
            type="text"
            autoComplete="username"
            required
            minLength={3}
            maxLength={24}
            pattern="[a-zA-Z0-9_]+"
            title="Letters, numbers, and underscore only"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="hangout-input"
            placeholder="your_handle"
          />
          <span className="text-xs font-normal font-sans text-[var(--muted)]">3–24 characters: letters, numbers, underscore.</span>
        </label>
        <label className="flex flex-col gap-2 font-sans text-sm font-medium text-[var(--foreground)]">
          <span className="text-[var(--muted)]">Display name</span>
          <input
            type="text"
            autoComplete="name"
            required
            minLength={1}
            maxLength={80}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="hangout-input"
            placeholder="How you appear to friends"
          />
        </label>
        <label className="flex flex-col gap-2 font-sans text-sm font-medium text-[var(--foreground)]">
          <span className="text-[var(--muted)]">Password (min 6 characters)</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="hangout-input"
          />
        </label>
        <label className="flex flex-col gap-2 font-sans text-sm font-medium text-[var(--foreground)]">
          <span className="text-[var(--muted)]">Confirm password</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="hangout-input"
          />
        </label>
        {error ? (
          <p className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={loading} className="hangout-btn-primary mt-1 w-full">
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="text-center font-sans text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/login" className="hangout-link">
          Log in
        </Link>
      </p>
    </div>
  );
}
