"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

type Health = { ok: boolean; service: string };
type Me = { uid: string };

export default function DashboardHomePage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const h = await apiFetch<Health>("/api/health", { method: "GET" });
        if (!cancelled) setHealth(h);
        const m = await apiFetch<Me>("/api/me", { method: "GET" });
        if (!cancelled) setMe(m);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not reach API");
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-10 font-sans">
      <div className="max-w-xl">
        <p className="hangout-eyebrow">Overview</p>
        <h1 className="font-display mt-3 text-4xl tracking-tight text-[var(--foreground)] md:text-[2.85rem]">Dashboard</h1>
        <p className="mt-4 text-[var(--muted)] leading-relaxed">
          You&apos;re signed in. Use search and requests to build your list, then fricker helps you pick who to see and what to do.
        </p>
      </div>

      <div className="hangout-card max-w-2xl p-8 text-sm leading-relaxed">
        <p className="font-display text-lg text-[var(--foreground)]">API status</p>
        {error ? <p className="mt-4 text-[var(--danger)]">{error}</p> : null}
        {!error && !health ? <p className="mt-4 text-[var(--muted)]">Checking…</p> : null}
        {health ? (
          <p className="mt-4 text-[var(--muted)]">
            Health:{" "}
            <span className="font-semibold text-[var(--foreground)]">{health.ok ? "reachable" : "degraded"}</span>
            <span className="text-[var(--muted)]"> · {health.service}</span>
          </p>
        ) : null}
        {me ? (
          <p className="mt-3 text-[var(--muted)]">
            Session uid{" "}
            <span className="break-all rounded-lg bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2 py-0.5 font-sans text-xs tracking-tight text-[var(--foreground)]">
              {me.uid}
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
