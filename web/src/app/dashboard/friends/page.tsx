"use client";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { SocialFriendEdge } from "@/types/social";

type FriendsResponse = { friends: SocialFriendEdge[] };

function SortableFriendCard({
  f,
  priority,
  onUnfriend,
}: {
  f: SocialFriendEdge;
  priority: number;
  onUnfriend: (uid: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: f.counterpartyUid,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 ${
        isDragging ? "z-10 opacity-90 shadow-lg" : ""
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          className="shrink-0 cursor-grab touch-none rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-xs text-[var(--muted)] active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label={`Drag to reorder ${f.profile.displayName}`}
        >
          ::
        </button>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            {priority === 1 ? "Next up" : `#${priority}`}
          </p>
          <p className="font-medium text-[var(--foreground)]">{f.profile.displayName}</p>
          <p className="text-sm text-[var(--muted)]">@{f.profile.username}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/dashboard/swipe?friend=${encodeURIComponent(f.counterpartyUid)}`}
          className="text-sm text-[var(--accent)] hover:underline"
        >
          Swipe
        </Link>
        <Link
          href={`/dashboard/friends/${encodeURIComponent(f.counterpartyUid)}/profile`}
          className="text-sm text-[var(--muted)] hover:underline"
        >
          View profile
        </Link>
        <button
          type="button"
          className="text-sm text-red-500 hover:underline"
          onClick={() => void onUnfriend(f.counterpartyUid)}
        >
          Unfriend
        </button>
      </div>
    </li>
  );
}

export default function FriendsListPage() {
  const [friends, setFriends] = useState<SocialFriendEdge[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  async function persistOrder(next: SocialFriendEdge[]) {
    try {
      await apiFetch("/api/friends/order", {
        method: "PATCH",
        body: JSON.stringify({
          orderedCounterpartyUids: next.map((x) => x.counterpartyUid),
        }),
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not save order");
      await load();
    }
  }

  function onDragEnd(event: DragEndEvent) {
    if (!friends?.length) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = friends.findIndex((x) => x.counterpartyUid === active.id);
    const newIndex = friends.findIndex((x) => x.counterpartyUid === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(friends, oldIndex, newIndex);
    setFriends(next);
    void persistOrder(next);
  }

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
            Manage friends and their order here — drag to set who shows first. Use{" "}
            <Link href="/dashboard/swipe" className="font-medium text-[var(--accent)] hover:underline">
              Swipe
            </Link>{" "}
            to pick activities and send invites.
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={friends.map((f) => f.counterpartyUid)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-3">
              {friends.map((f, index) => (
                <SortableFriendCard
                  key={f.counterpartyUid}
                  f={f}
                  priority={index + 1}
                  onUnfriend={unfriend}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
