"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SocialFriendEdge } from "@/types/social";

const SWIPE_THRESHOLD_PX = 72;
const EXIT_MS = 280;
const SPRING_MS = 220;

type SwipeFriendDeckProps = {
  friend: SocialFriendEdge | null;
  onSkip: () => void;
  onChoose: () => Promise<void>;
  reducedMotion: boolean;
};

export function SwipeFriendDeck({ friend, onSkip, onChoose, reducedMotion }: SwipeFriendDeckProps) {
  const [dragX, setDragX] = useState(0);
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);
  const [springing, setSpringing] = useState(false);
  const startXRef = useRef(0);
  const activePointerRef = useRef<number | null>(null);
  const exitHandledRef = useRef(false);

  useEffect(() => {
    if (!friend) {
      setDragX(0);
      setExiting(null);
      setSpringing(false);
    }
  }, [friend]);

  const finishLeft = useCallback(() => {
    onSkip();
    setExiting(null);
    setDragX(0);
  }, [onSkip]);

  const finishRight = useCallback(() => {
    void onChoose().finally(() => {
      setExiting(null);
      setDragX(0);
    });
  }, [onChoose]);

  const commitDirection = useCallback(
    (dir: "left" | "right") => {
      if (!friend) return;
      if (reducedMotion) {
        if (dir === "left") finishLeft();
        else void finishRight();
        return;
      }
      exitHandledRef.current = false;
      setExiting(dir);
    },
    [friend, reducedMotion, finishLeft, finishRight],
  );

  const onExitTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (!exiting || exitHandledRef.current) return;
      if (e.propertyName !== "transform") return;
      exitHandledRef.current = true;
      if (exiting === "left") finishLeft();
      else void finishRight();
    },
    [exiting, finishLeft, finishRight],
  );

  function onPointerDown(e: React.PointerEvent) {
    if (!friend || exiting) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    activePointerRef.current = e.pointerId;
    startXRef.current = e.clientX;
    setSpringing(false);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!friend || exiting || activePointerRef.current !== e.pointerId) return;
    setDragX(e.clientX - startXRef.current);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!friend || exiting || activePointerRef.current !== e.pointerId) return;
    activePointerRef.current = null;
    const x = e.clientX - startXRef.current;
    if (x > SWIPE_THRESHOLD_PX) {
      commitDirection("right");
    } else if (x < -SWIPE_THRESHOLD_PX) {
      commitDirection("left");
    } else {
      if (reducedMotion) {
        setDragX(0);
        return;
      }
      setSpringing(true);
      setDragX(0);
      window.setTimeout(() => setSpringing(false), SPRING_MS);
    }
  }

  function onPointerCancel(e: React.PointerEvent) {
    if (activePointerRef.current === e.pointerId) {
      activePointerRef.current = null;
      setDragX(0);
    }
  }

  if (!friend) return null;

  const rotate = reducedMotion ? 0 : dragX * 0.04;
  let transform: string;
  let opacity = 1;
  if (exiting === "left") {
    transform = "translateX(-140%) rotate(-14deg)";
    opacity = 0;
  } else if (exiting === "right") {
    transform = "translateX(140%) rotate(14deg)";
    opacity = 0;
  } else {
    transform = `translateX(${dragX}px) rotate(${rotate}deg)`;
  }

  const transition =
    exiting || springing
      ? `transform ${reducedMotion ? 0 : exiting ? EXIT_MS : SPRING_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${reducedMotion ? 0 : exiting ? EXIT_MS : SPRING_MS}ms ease`
      : "none";

  const { profile } = friend;

  return (
    <div className="mx-auto w-full max-w-md">
      <div
        role="presentation"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onTransitionEnd={onExitTransitionEnd}
        className="cursor-grab touch-none active:cursor-grabbing"
        style={{
          transform,
          opacity,
          transition,
        }}
      >
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Next up</p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--foreground)]">{profile.displayName}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">@{profile.username}</p>
          <p className="mt-4 text-center text-xs text-[var(--muted)]">Skip to rotate · Choose to plan with them</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          className="rounded-xl border border-[var(--border)] bg-[var(--background)] py-4 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--card)]"
          onClick={() => commitDirection("left")}
          disabled={!!exiting}
        >
          Skip
        </button>
        <button
          type="button"
          className="rounded-xl bg-[var(--accent)] py-4 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          onClick={() => commitDirection("right")}
          disabled={!!exiting}
        >
          Choose
        </button>
      </div>
    </div>
  );
}
