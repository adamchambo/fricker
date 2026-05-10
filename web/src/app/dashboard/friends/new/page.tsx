"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { PublicProfile } from "@/types/social";

type SearchResponse = { users: PublicProfile[] };
type ProfileMeResponse = { uid: string; public: PublicProfile | null };

function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

export default function AddFriendPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PublicProfile[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [myUid, setMyUid] = useState<string | null>(null);
  const [myUsernameLower, setMyUsernameLower] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const profile = await apiFetch<ProfileMeResponse>("/api/profile/me", { method: "GET" });
        if (cancelled) return;
        setMyUid(profile.uid);
        setMyUsernameLower(profile.public?.usernameLower ?? null);
      } catch {
        /* signed out or API down */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const search = useCallback(async () => {
    setError(null);
    setMsg(null);
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError("Type at least 2 characters to search.");
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch<SearchResponse>(
        `/api/users/search?q=${encodeURIComponent(trimmed)}`,
        { method: "GET" },
      );
      const qNorm = normalizeUsername(trimmed);
      const others = myUid ? res.users.filter((u) => u.uid !== myUid) : res.users;
      setResults(others);
      if (myUsernameLower && qNorm === myUsernameLower && others.length === 0) {
        setMsg("That’s your username — you can’t add yourself. Search for someone else.");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Search failed");
      setResults([]);
    } finally {
      setBusy(false);
    }
  }, [q, myUid, myUsernameLower]);

  async function sendRequest(username: string) {
    setError(null);
    setMsg(null);
    try {
      await apiFetch("/api/friends/requests", {
        method: "POST",
        body: JSON.stringify({ toUsername: username }),
      });
      setMsg(`Request sent to @${username}. They should open Requests in the nav (or Friends → Requests) to accept.`);
    } catch (e: unknown) {
      const m = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Request failed";
      setError(m);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Add friend</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Search by @username. They need a public profile and must accept your request.
        </p>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex flex-wrap gap-2">
          <input
            className="hangout-input min-w-[12rem] flex-1"
            placeholder="username (no @)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void search())}
          />
          <button type="button" disabled={busy} className="hangout-btn-primary px-4" onClick={() => void search()}>
            {busy ? "Searching…" : "Search"}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
        {msg ? <p className="mt-3 text-sm text-[var(--muted)]">{msg}</p> : null}
        {results && results.length === 0 && !error && !msg ? (
          <p className="mt-4 text-sm text-[var(--muted)]">No matches.</p>
        ) : null}
        {results && results.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {results.map((u) => (
              <li
                key={u.uid}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] px-3 py-2"
              >
                <div>
                  <p className="font-medium text-[var(--foreground)]">{u.displayName}</p>
                  <p className="text-sm text-[var(--muted)]">@{u.username}</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--background)]"
                  onClick={() => void sendRequest(u.username)}
                >
                  Send request
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <p className="text-sm text-[var(--muted)]">
        <Link href="/dashboard/friends/requests" className="text-[var(--accent)] hover:underline">
          Open requests
        </Link>
        {" · "}
        <Link href="/dashboard/friends" className="text-[var(--accent)] hover:underline">
          Back to friends
        </Link>
      </p>
    </div>
  );
}
