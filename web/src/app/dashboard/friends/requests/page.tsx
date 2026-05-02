"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { PublicProfile } from "@/types/social";

type IncomingRow = { id: string; fromUid: string; profile: PublicProfile | null };
type OutgoingRow = { id: string; toUid: string; profile: PublicProfile | null };

type IncomingRes = { requests: IncomingRow[] };
type OutgoingRes = { requests: OutgoingRow[] };

export default function FriendRequestsPage() {
  const [incoming, setIncoming] = useState<IncomingRow[] | null>(null);
  const [outgoing, setOutgoing] = useState<OutgoingRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [inc, out] = await Promise.all([
        apiFetch<IncomingRes>("/api/friends/requests/incoming", { method: "GET" }),
        apiFetch<OutgoingRes>("/api/friends/requests/outgoing", { method: "GET" }),
      ]);
      setIncoming(inc.requests);
      setOutgoing(out.requests);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setIncoming([]);
      setOutgoing([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function accept(fromUid: string) {
    setError(null);
    try {
      await apiFetch("/api/friends/requests/accept", {
        method: "POST",
        body: JSON.stringify({ fromUid }),
      });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Accept failed");
    }
  }

  async function decline(fromUid: string) {
    setError(null);
    try {
      await apiFetch("/api/friends/requests/decline", {
        method: "POST",
        body: JSON.stringify({ fromUid }),
      });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Decline failed");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Friend requests</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Accept to connect — then they appear on your friends list.</p>
        </div>
        <Link href="/dashboard/friends" className="text-sm font-medium text-[var(--accent)] hover:underline">
          Back to friends
        </Link>
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-medium text-[var(--foreground)]">Incoming</h2>
        {incoming === null ? (
          <p className="mt-2 text-sm text-[var(--muted)]">Loading…</p>
        ) : incoming.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">No pending requests.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {incoming.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3 last:border-0">
                <div>
                  <p className="font-medium text-[var(--foreground)]">{r.profile?.displayName ?? r.fromUid}</p>
                  {r.profile ? <p className="text-sm text-[var(--muted)]">@{r.profile.username}</p> : null}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm text-white"
                    onClick={() => void accept(r.fromUid)}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
                    onClick={() => void decline(r.fromUid)}
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-medium text-[var(--foreground)]">Outgoing</h2>
        {outgoing === null ? (
          <p className="mt-2 text-sm text-[var(--muted)]">Loading…</p>
        ) : outgoing.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">No pending outgoing requests.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {outgoing.map((r) => (
              <li key={r.id} className="text-sm text-[var(--foreground)]">
                Pending → {r.profile ? `@${r.profile.username} (${r.profile.displayName})` : r.toUid}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
