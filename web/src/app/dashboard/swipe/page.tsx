"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FriendIdeasFlipCard } from "@/components/friend-ideas-flip-card";
import { InviteHangoutDialog } from "@/components/invite-hangout-dialog";
import { SwipeFriendDeck } from "@/components/swipe-friend-deck";
import { SwipeInitialSkeleton } from "@/components/swipe-initial-skeleton";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { SocialFriendEdge, SuggestionsGenerateResponse } from "@/types/social";
import { suggestionRowKey, type SuggestionItem } from "@/types/suggestion";

type FriendsResponse = { friends: SocialFriendEdge[] };

type Phase = "pickFriend" | "activities";

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
  const [planningFriend, setPlanningFriend] = useState<SocialFriendEdge | null>(null);
  const [queue, setQueue] = useState<SuggestionItem[]>([]);
  const [ideaSource, setIdeaSource] = useState<"llm" | "fallback" | undefined>(undefined);
  const [chosenActivity, setChosenActivity] = useState<SuggestionItem | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteNote, setInviteNote] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [savingRowKey, setSavingRowKey] = useState<string | null>(null);

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

  useEffect(() => {
    if (!friends?.length || !friendFromUrl) return;
    const f = friends.find((x) => x.counterpartyUid === friendFromUrl);
    if (f) setPlanningFriend(f);
  }, [friends, friendFromUrl]);

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

  const skipFriend = useCallback(() => {
    setFriendQueue((q) => (q.length <= 1 ? q : [...q.slice(1), q[0]]));
  }, []);

  const chooseFriend = useCallback(async () => {
    const f = friendQueue[0];
    if (!f) return;
    setPlanningFriend(f);
    setFriendId(f.counterpartyUid);
    setFriendQueue((q) => q.slice(1));
    setQueue([]);
    setIdeaSource(undefined);
    setToast(null);
    router.replace(`/dashboard/swipe?friend=${encodeURIComponent(f.counterpartyUid)}`, { scroll: false });
    setPhase("activities");
  }, [friendQueue, router]);

  const generateIdeas = useCallback(async () => {
    if (!friendId) return;
    setError(null);
    setGenerating(true);
    try {
      const res = await apiFetch<SuggestionsGenerateResponse>(
        `/api/suggestions/${encodeURIComponent(friendId)}/generate`,
        { method: "POST" },
      );
      setQueue(res.suggestions ?? []);
      setIdeaSource(res.source);
      if (!res.suggestions?.length) {
        setToast("No ideas returned — try Refresh ideas.");
      } else if (res.source === "fallback") {
        setToast("Using offline ideas — AI wasn’t reachable.");
      } else {
        setToast(null);
      }
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Could not generate ideas");
      setQueue([]);
    } finally {
      setGenerating(false);
    }
  }, [friendId]);

  useEffect(() => {
    if (phase !== "activities" || !friendId) return;
    void generateIdeas();
  }, [phase, friendId, generateIdeas]);

  const saveIdeaForLater = useCallback(
    async (s: SuggestionItem) => {
      if (!friendId) return;
      const key = suggestionRowKey(s);
      setSavingRowKey(key);
      setError(null);
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
        setQueue((q) => q.filter((x) => suggestionRowKey(x) !== key));
        setToast("Saved to your list.");
      } catch (e: unknown) {
        setError(e instanceof ApiError ? e.message : "Save failed");
      } finally {
        setSavingRowKey(null);
      }
    },
    [friendId],
  );

  function openInvite(s: SuggestionItem) {
    setChosenActivity(s);
    setInviteNote("");
    setInviteOpen(true);
  }

  function closeInvite() {
    setInviteOpen(false);
    setChosenActivity(null);
    setInviteNote("");
  }

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
      const key = suggestionRowKey(chosenActivity);
      setQueue((q) => q.filter((x) => suggestionRowKey(x) !== key));
      setToast("Invite sent — check Plans.");
      closeInvite();
      setPhase("pickFriend");
      setPlanningFriend(null);
      router.replace("/dashboard/swipe", { scroll: false });
      await loadFriends();
      setFriendQueue([]);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Could not send invite");
    } finally {
      setSending(false);
    }
  }

  function changeFriend() {
    setPhase("pickFriend");
    setQueue([]);
    setPlanningFriend(null);
    setIdeaSource(undefined);
    closeInvite();
    router.replace("/dashboard/swipe", { scroll: false });
    if (friends?.length) setFriendQueue([...friends]);
  }

  const planFriend = planningFriend ?? friends?.find((f) => f.counterpartyUid === friendId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Swipe</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {phase === "pickFriend"
            ? "Swipe through friends — who do you want to plan with?"
            : "Flip the card for ideas, then tap one to send a hangout invite."}
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
        <SwipeInitialSkeleton />
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
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-[var(--foreground)]">
              Planning with{" "}
              <strong>{planFriend?.profile.displayName ?? friendId}</strong>
            </p>
            <button type="button" onClick={() => changeFriend()} className="text-sm text-[var(--accent)] hover:underline">
              Change friend
            </button>
            <button
              type="button"
              disabled={generating || !friendId}
              onClick={() => void generateIdeas()}
              className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50"
            >
              {generating ? "Refreshing…" : "Refresh ideas"}
            </button>
            <Link href="/dashboard/invites" className="text-sm text-[var(--muted)] hover:underline">
              Plans
            </Link>
          </div>

          {planFriend ? (
            <FriendIdeasFlipCard
              key={planFriend.counterpartyUid}
              friend={planFriend}
              ideas={queue}
              ideasLoading={generating}
              ideaSource={ideaSource}
              reducedMotion={reducedMotion}
              onPickIdea={openInvite}
              onSaveIdea={(s) => void saveIdeaForLater(s)}
              savingId={savingRowKey}
            />
          ) : (
            <SwipeInitialSkeleton />
          )}
        </>
      )}

      <InviteHangoutDialog
        open={inviteOpen}
        activity={chosenActivity}
        inviteNote={inviteNote}
        onInviteNoteChange={setInviteNote}
        onClose={closeInvite}
        onSend={() => void sendInvite()}
        sending={sending}
      />
    </div>
  );
}
