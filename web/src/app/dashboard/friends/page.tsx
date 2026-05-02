"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { SocialFriendEdge } from "@/types/social";

type FriendsResponse = { friends: SocialFriendEdge[] };

export default function FriendsListPage() {
  const [friends, setFriends] = useState<SocialFriendEdge[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await apiFetch<FriendsResponse>("/api/friends", { method: "GET" });
      setFriends(res.friends);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load friends");
      setFriends([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function unfriend(counterpartyUid: string) {
    if (!confirm("Remove this friend? You can send a new request later.")) return;
    try {
      await apiFetch(`/api/friends/${encodeURIComponent(counterpartyUid)}`, { method: "DELETE" });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Remove failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Friends</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Real accounts on fricker — add people by @username, accept requests, then plan hangouts on{" "}
            <Link href="/dashboard/swipe" className="text-[var(--accent)] hover:underline">
              Swipe
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/friends/requests"
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background)]"
          >
            Requests
          </Link>
          <Link
            href="/dashboard/friends/new"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Add friend
          </Link>
        </div>
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {friends === null ? (
        <p className="text-[var(--muted)]">Loading…</p>
      ) : friends.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] px-6 py-12 text-center">
          <p className="text-[var(--foreground)]">No friends yet</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Search by username and send a request — they accept, then you&apos;ll see them here.
          </p>
          <Link
            href="/dashboard/friends/new"
            className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
          >
            Find someone
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {friends.map((f) => (
            <li
              key={f.counterpartyUid}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3"
            >
              <div>
                <p className="font-medium text-[var(--foreground)]">{f.profile.displayName}</p>
                <p className="text-sm text-[var(--muted)]">@{f.profile.username}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/dashboard/friends/${encodeURIComponent(f.counterpartyUid)}/profile`}
                  className="text-sm text-[var(--muted)] hover:underline"
                >
                  View profile
                </Link>
                <button
                  type="button"
                  className="text-sm text-red-500 hover:underline"
                  onClick={() => void unfriend(f.counterpartyUid)}
                >
                  Unfriend
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
