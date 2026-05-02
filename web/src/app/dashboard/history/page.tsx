"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { HangoutHistoryItem } from "@/types/history";
import type { SocialFriendEdge } from "@/types/social";

type HistoryResponse = { history: HangoutHistoryItem[] };
type FriendsResponse = { friends: SocialFriendEdge[] };

export default function HistoryPage() {
  const [items, setItems] = useState<HangoutHistoryItem[] | null>(null);
  const [friends, setFriends] = useState<SocialFriendEdge[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [friendId, setFriendId] = useState("");
  const [friendName, setFriendName] = useState("");
  const [activity, setActivity] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState<string>("");

  const loadHistory = useCallback(async () => {
    setError(null);
    try {
      const res = await apiFetch<HistoryResponse>("/api/history", { method: "GET" });
      setItems(res.history);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load history");
      setItems([]);
    }
  }, []);

  const loadFriends = useCallback(async () => {
    try {
      const res = await apiFetch<FriendsResponse>("/api/friends", { method: "GET" });
      setFriends(res.friends);
    } catch {
      setFriends([]);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
    void loadFriends();
  }, [loadHistory, loadFriends]);

  function onFriendSelect(counterpartyUid: string) {
    setFriendId(counterpartyUid);
    const f = friends?.find((x) => x.counterpartyUid === counterpartyUid);
    setFriendName(f ? f.profile.displayName : "");
  }

  async function addHangout(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/api/history", {
        method: "POST",
        body: JSON.stringify({
          friendId,
          friendName,
          activity,
          date: new Date(date).toISOString(),
          notes,
          rating: rating === "" ? null : Number(rating),
        }),
      });
      setFriendId("");
      setFriendName("");
      setActivity("");
      setNotes("");
      setRating("");
      await loadHistory();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save");
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Activity history</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Track what you did and how it felt.</p>
      </div>
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-medium text-[var(--foreground)]">Log completed hangout</h2>
        <form onSubmit={(e) => void addHangout(e)} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="text-[var(--muted)]">Friend</span>
            <select
              className={inputClass}
              value={friendId}
              onChange={(e) => onFriendSelect(e.target.value)}
              required
            >
              <option value="">Select a friend…</option>
              {(friends ?? []).map((f) => (
                <option key={f.counterpartyUid} value={f.counterpartyUid}>
                  {f.profile.displayName} (@{f.profile.username})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-[var(--muted)]">Friend name (for this entry)</span>
            <input className={inputClass} value={friendName} onChange={(e) => setFriendName(e.target.value)} required />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-[var(--muted)]">Activity</span>
            <input className={inputClass} value={activity} onChange={(e) => setActivity(e.target.value)} required />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--muted)]">Date</span>
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--muted)]">Rating (1–5, optional)</span>
            <input className={inputClass} value={rating} onChange={(e) => setRating(e.target.value)} inputMode="numeric" />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-[var(--muted)]">Notes</span>
            <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <button type="submit" className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white sm:col-span-2">
            Save to history
          </button>
        </form>
      </section>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <section>
        <h2 className="text-lg font-medium text-[var(--foreground)]">Past hangouts</h2>
        {items === null ? (
          <p className="mt-2 text-[var(--muted)]">Loading…</p>
        ) : items.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">Nothing logged yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {items.map((h) => (
              <li key={h.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm">
                <p className="font-medium text-[var(--foreground)]">{h.activity}</p>
                <p className="text-[var(--muted)]">
                  with {h.friendName} · {new Date(h.date).toLocaleDateString()}
                </p>
                {h.rating ? <p className="mt-1 text-[var(--foreground)]">Rating: {h.rating}/5</p> : null}
                {h.notes ? <p className="mt-1 text-[var(--muted)]">{h.notes}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
