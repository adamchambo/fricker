"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SwipeDeck } from "@/components/swipe-deck";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { SocialFriendEdge, SuggestionsGenerateResponse } from "@/types/social";
import type { SuggestionItem } from "@/types/suggestion";

type FriendsResponse = { friends: SocialFriendEdge[] };

function buildInviteText(s: SuggestionItem): string {
  return `${s.title}\n\n${s.reason}\n\n${s.estimatedCost} · ${s.estimatedDuration}`;
}

export default function SwipePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const friendFromUrl = searchParams.get("friend")?.trim() ?? "";

  const [friends, setFriends] = useState<SocialFriendEdge[] | null>(null);
  const [friendId, setFriendId] = useState(friendFromUrl);
  const [queue, setQueue] = useState<SuggestionItem[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const fn = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  useEffect(() => {
    if (friendFromUrl) setFriendId(friendFromUrl);
  }, [friendFromUrl]);

  const loadFriends = useCallback(async () => {
    setLoadingFriends(true);
    setError(null);
    try {
      const res = await apiFetch<FriendsResponse>("/api/friends", { method: "GET" });
      setFriends(res.friends);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load friends");
      setFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  }, []);

  useEffect(() => {
    void loadFriends();
  }, [loadFriends]);

  useEffect(() => {
    if (loadingFriends || !friends?.length) return;
    if (friendFromUrl) return;
    const first = friends[0].counterpartyUid;
    router.replace(`/dashboard/swipe?friend=${encodeURIComponent(first)}`, { scroll: false });
  }, [loadingFriends, friends, friendFromUrl, router]);

  function onSelectFriend(uid: string) {
    setFriendId(uid);
    setQueue([]);
    setToast(null);
    router.replace(`/dashboard/swipe?friend=${encodeURIComponent(uid)}`, { scroll: false });
  }

  async function generateIdeas() {
    if (!friendId) return;
    setError(null);
    setToast(null);
    setGenerating(true);
    try {
      const res = await apiFetch<SuggestionsGenerateResponse>(
        `/api/suggestions/${encodeURIComponent(friendId)}/generate`,
        { method: "POST" },
      );
      setQueue(res.suggestions ?? []);
      if (!res.suggestions?.length) setToast("No ideas returned — try again.");
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Could not generate ideas");
    } finally {
      setGenerating(false);
    }
  }

  const top = queue[0] ?? null;

  const saveTop = useCallback(async () => {
    const s = queue[0];
    if (!s || !friendId) return;
    try {
      const inviteText = buildInviteText(s);
      await apiFetch("/api/saved-suggestions", {
        method: "POST",
        body: JSON.stringify({
          friendId,
          title: s.title,
          reason: s.reason,
          estimatedCost: s.estimatedCost,
          estimatedDuration: s.estimatedDuration,
          nearbyPlaces: s.nearbyPlaces ?? [],
          inviteText,
        }),
      });
      setQueue((q) => q.slice(1));
      setToast("Saved.");
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Save failed");
      throw e;
    }
  }, [queue, friendId]);

  const passTop = useCallback(() => {
    setQueue((q) => q.slice(1));
  }, []);

  const selectClass =
    "mt-1 w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Swipe</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Pick a friend, get ideas, then skip or save. Drag the card or use the buttons.
        </p>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {toast ? <p className="text-sm text-[var(--muted)]">{toast}</p> : null}

      {loadingFriends ? (
        <p className="text-[var(--muted)]">Loading…</p>
      ) : !friends?.length ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] px-6 py-10 text-center">
          <p className="text-[var(--foreground)]">Add a friend first</p>
          <p className="mt-2 text-sm text-[var(--muted)]">You need someone to plan with.</p>
          <Link href="/dashboard/friends/new" className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:underline">
            Find someone
          </Link>
        </div>
      ) : (
        <>
          <label className="block max-w-md text-sm">
            <span className="text-[var(--muted)]">Friend</span>
            <select
              className={selectClass}
              value={friendId}
              onChange={(e) => onSelectFriend(e.target.value)}
            >
              {friends.map((f) => (
                <option key={f.counterpartyUid} value={f.counterpartyUid}>
                  {f.profile.displayName} (@{f.profile.username})
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={generating || !friendId}
              onClick={() => void generateIdeas()}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {generating ? "Getting ideas…" : queue.length === 0 ? "Get ideas" : "More ideas"}
            </button>
            <Link href="/dashboard/saved" className="text-sm text-[var(--accent)] hover:underline">
              Saved
            </Link>
          </div>

          {top ? (
            <SwipeDeck
              key={`${friendId}-${queue.length}`}
              card={top}
              onPass={passTop}
              onSave={saveTop}
              reducedMotion={reducedMotion}
            />
          ) : !generating ? (
            <p className="text-sm text-[var(--muted)]">No cards in the deck — tap Get ideas.</p>
          ) : null}
        </>
      )}
    </div>
  );
}
