"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { HangoutInviteRow } from "@/types/invite";

type InvitesResponse = { invites: HangoutInviteRow[] };

export default function InvitesPage() {
  const [inbox, setInbox] = useState<HangoutInviteRow[] | null>(null);
  const [outbox, setOutbox] = useState<HangoutInviteRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [inRes, outRes] = await Promise.all([
        apiFetch<InvitesResponse>("/api/invites/inbox", { method: "GET" }),
        apiFetch<InvitesResponse>("/api/invites/outbox", { method: "GET" }),
      ]);
      setInbox(inRes.invites);
      setOutbox(outRes.invites);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load invites");
      setInbox([]);
      setOutbox([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function accept(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await apiFetch(`/api/invites/${encodeURIComponent(id)}/accept`, { method: "POST" });
      await load();
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Accept failed");
    } finally {
      setBusyId(null);
    }
  }

  async function decline(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await apiFetch(`/api/invites/${encodeURIComponent(id)}/decline`, { method: "POST" });
      await load();
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Decline failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Invites</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Plans friends send you appear in Inbox. After someone accepts, friend order updates on both sides — see{" "}
          <Link href="/dashboard/friends" className="text-[var(--accent)] hover:underline">
            Friends
          </Link>
          .
        </p>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <section>
        <h2 className="text-lg font-medium text-[var(--foreground)]">Inbox</h2>
        {inbox === null ? (
          <p className="mt-2 text-[var(--muted)]">Loading…</p>
        ) : inbox.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">No pending invites.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {inbox.map((inv) => (
              <li
                key={inv.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
              >
                <p className="font-medium text-[var(--foreground)]">{inv.activity.title}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{inv.activity.reason}</p>
                <p className="mt-2 text-sm text-[var(--foreground)]">
                  {inv.activity.estimatedCost} · {inv.activity.estimatedDuration}
                </p>
                {inv.message ? (
                  <p className="mt-2 rounded-lg bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]">
                    “{inv.message}”
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-[var(--muted)]">From uid {inv.fromUid.slice(0, 8)}…</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === inv.id}
                    onClick={() => void accept(inv.id)}
                    className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={busyId === inv.id}
                    onClick={() => void decline(inv.id)}
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm disabled:opacity-60"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium text-[var(--foreground)]">Sent</h2>
        {outbox === null ? (
          <p className="mt-2 text-[var(--muted)]">Loading…</p>
        ) : outbox.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">Nothing sent yet. Use Swipe to send a plan.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {outbox.map((inv) => (
              <li
                key={inv.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
              >
                <p className="font-medium text-[var(--foreground)]">{inv.activity.title}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{inv.activity.reason}</p>
                <p className="mt-2 text-xs capitalize text-[var(--muted)]">Status: {inv.status}</p>
                {inv.message ? (
                  <p className="mt-2 text-sm text-[var(--muted)]">Your note: {inv.message}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
