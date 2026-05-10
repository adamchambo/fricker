"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SwipeDeck } from "@/components/swipe-deck";
import { SwipeFriendDeck } from "@/components/swipe-friend-deck";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { SocialFriendEdge, SuggestionsGenerateResponse } from "@/types/social";
import type { SuggestionItem } from "@/types/suggestion";

type FriendsResponse = { friends: SocialFriendEdge[] };

type Phase = "pickFriend" | "activities" | "send";

function buildInviteText(s: SuggestionItem): string {
  return `${s.title}\n\n${s.reason}\n\n${s.estimatedCost} · ${s.estimatedDuration}`;
}

export default function SwipePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const friendFromUrl = searchParams.get("friend")?.trim() ?? "";

  const [phase, setPhase] = useState<Phase>(() => (friendFromUrl ? "activities" : "pickFriend"));
  const [friends, setFriends] = useState<SocialFriendEdge[] | null>(null);
  const [friendQueue, setFriendQueue] = useState<SocialFriendEdge[]>([]);
  const [friendId, setFriendId] = useState(friendFromUrl);
  const [queue, setQueue] = useState<SuggestionItem[]>([]);
  const [chosenActivity, setChosenActivity] = useState<SuggestionItem | null>(null);
  const [inviteNote, setInviteNote] = useState("");
  const [sending, setSending] = useState(false);
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
    if (friendFromUrl) {
      setFriendId(friendFromUrl);
      setPhase("activities");
    }
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
    if (!friends?.length || friendFromUrl) return;
    if (phase === "pickFriend") {
      setFriendQueue((q) => (q.length === 0 ? [...friends] : q));
    }
  }, [friends, friendFromUrl, phase]);

  const topFriend = friendQueue[0] ?? null;
  const topActivity = queue[0] ?? null;

  const skipFriend = useCallback(() => {
    setFriendQueue((q) => (q.length <= 1 ? q : [...q.slice(1), q[0]]));
  }, []);

  const chooseFriend = useCallback(async () => {
    const f = friendQueue[0];
    if (!f) return;
    setFriendId(f.counterpartyUid);
    setFriendQueue((q) => q.slice(1));
    setQueue([]);
    setToast(null);
    router.replace(`/dashboard/swipe?friend=${encodeURIComponent(f.counterpartyUid)}`, { scroll: false });
    setPhase("activities");
  }, [friendQueue, router]);

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

  const saveCurrentToSaved = useCallback(async () => {
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
      setToast("Saved to your list.");
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Save failed");
    }
  }, [queue, friendId]);

  const passActivity = useCallback(() => {
    setQueue((q) => q.slice(1));
  }, []);

  const chooseActivity = useCallback(async () => {
    const s = queue[0];
    if (!s) return;
    setChosenActivity(s);
    setQueue((q) => q.slice(1));
    setInviteNote("");
    setPhase("send");
  }, [queue]);

  async function sendInvite() {
    if (!chosenActivity || !friendId) return;
    setSending(true);
    setError(null);
    try {
      await apiFetch("/api/invites", {
        method: "POST",
        body: JSON.stringify({
          counterpartyUid: friendId,
          activity: chosenActivity,
          message: inviteNote.trim() || undefined,
        }),
      });
      setToast("Invite sent. They’ll see it in Invites.");
      setChosenActivity(null);
      setInviteNote("");
      setPhase("pickFriend");
      router.replace("/dashboard/swipe", { scroll: false });
      await loadFriends();
      setFriendQueue([]);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Could not send invite");
    } finally {
      setSending(false);
    }
  }

  function backToActivities() {
    if (chosenActivity) {
      setQueue((q) => [chosenActivity, ...q]);
    }
    setChosenActivity(null);
    setInviteNote("");
    setPhase("activities");
  }

  function changeFriend() {
    setPhase("pickFriend");
    setQueue([]);
    setChosenActivity(null);
    router.replace("/dashboard/swipe", { scroll: false });
    if (friends?.length) setFriendQueue([...friends]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Swipe</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {phase === "pickFriend"
            ? "Swipe through friends — who do you want to plan with?"
            : phase === "activities"
              ? "Get ideas, then choose one to send as a hangout invite."
              : "Add an optional note and send the invite."}
        </p>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Both people need a public profile and prefs for good suggestions.{" "}
          <Link href="/dashboard/profile" className="text-[var(--accent)] hover:underline">
            Profile
          </Link>
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
          <Link
            href="/dashboard/friends/new"
            className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
          >
            Find someone
          </Link>
        </div>
      ) : phase === "pickFriend" ? (
        <>
          {topFriend ? (
            <SwipeFriendDeck
              key={topFriend.counterpartyUid + String(friendQueue.length)}
              friend={topFriend}
              onSkip={skipFriend}
              onChoose={chooseFriend}
              reducedMotion={reducedMotion}
            />
          ) : (
            <p className="text-sm text-[var(--muted)]">No friends in queue — reload or add friends.</p>
          )}
          {friendFromUrl ? (
            <button
              type="button"
              onClick={() => changeFriend()}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              Or pick someone else
            </button>
          ) : null}
        </>
      ) : phase === "activities" ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-[var(--foreground)]">
              Planning with{" "}
              <strong>
                {friends.find((f) => f.counterpartyUid === friendId)?.profile.displayName ?? friendId}
              </strong>
            </p>
            <button type="button" onClick={() => changeFriend()} className="text-sm text-[var(--accent)] hover:underline">
              Change friend
            </button>
            <Link href="/dashboard/invites" className="text-sm text-[var(--muted)] hover:underline">
              Invites
            </Link>
            <Link href="/dashboard/saved" className="text-sm text-[var(--muted)] hover:underline">
              Saved
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={generating || !friendId}
              onClick={() => void generateIdeas()}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {generating ? "Getting ideas…" : queue.length === 0 ? "Get ideas" : "More ideas"}
            </button>
          </div>

          {topActivity ? (
            <>
              <SwipeDeck
                key={`${friendId}-${queue.length}`}
                card={topActivity}
                onPass={passActivity}
                onSwipeRight={chooseActivity}
                rightLabel="Choose"
                reducedMotion={reducedMotion}
              />
              <button
                type="button"
                onClick={() => void saveCurrentToSaved()}
                className="text-sm text-[var(--muted)] underline hover:text-[var(--foreground)]"
              >
                Save this card for later (no invite)
              </button>
            </>
          ) : !generating ? (
            <p className="text-sm text-[var(--muted)]">No cards in the deck — tap Get ideas.</p>
          ) : null}
        </>
      ) : (
        chosenActivity && (
          <div className="mx-auto max-w-md space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Send hangout invite</h2>
            <div>
              <p className="font-medium text-[var(--foreground)]">{chosenActivity.title}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{chosenActivity.reason}</p>
              <p className="mt-2 text-sm text-[var(--foreground)]">
                {chosenActivity.estimatedCost} · {chosenActivity.estimatedDuration}
              </p>
            </div>
            <label className="block text-sm">
              <span className="text-[var(--muted)]">Optional note</span>
              <textarea
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
                rows={3}
                value={inviteNote}
                onChange={(e) => setInviteNote(e.target.value)}
                placeholder="e.g. Want to do this Saturday?"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={sending}
                onClick={() => void sendInvite()}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {sending ? "Sending…" : "Send invite"}
              </button>
              <button
                type="button"
                onClick={() => backToActivities()}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
              >
                Back
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
