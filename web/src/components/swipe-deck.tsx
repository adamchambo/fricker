"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SuggestionItem } from "@/types/suggestion";

const SWIPE_THRESHOLD_PX = 72;
const EXIT_MS = 280;
const SPRING_MS = 220;

type SwipeDeckProps = {
  card: SuggestionItem | null;
  onPass: () => void;
  onSave: () => Promise<void>;
  reducedMotion: boolean;
};

export function SwipeDeck({ card, onPass, onSave, reducedMotion }: SwipeDeckProps) {
  const [dragX, setDragX] = useState(0);
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);
  const [springing, setSpringing] = useState(false);
  const startXRef = useRef(0);
  const activePointerRef = useRef<number | null>(null);
  const exitHandledRef = useRef(false);

  useEffect(() => {
    if (!card) {
      setDragX(0);
      setExiting(null);
      setSpringing(false);
    }
  }, [card]);

  const finishLeft = useCallback(() => {
    onPass();
    setExiting(null);
    setDragX(0);
  }, [onPass]);

  const finishRight = useCallback(() => {
    void onSave().finally(() => {
      setExiting(null);
      setDragX(0);
    });
  }, [onSave]);

  const commitDirection = useCallback(
    (dir: "left" | "right") => {
      if (!card) return;
      if (reducedMotion) {
        if (dir === "left") finishLeft();
        else void finishRight();
        return;
      }
      exitHandledRef.current = false;
      setExiting(dir);
    },
    [card, reducedMotion, finishLeft, finishRight],
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
    if (!card || exiting) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    activePointerRef.current = e.pointerId;
    startXRef.current = e.clientX;
    setSpringing(false);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!card || exiting || activePointerRef.current !== e.pointerId) return;
    setDragX(e.clientX - startXRef.current);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!card || exiting || activePointerRef.current !== e.pointerId) return;
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

  if (!card) return null;

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
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{card.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{card.reason}</p>
          <p className="mt-4 text-sm text-[var(--foreground)]">
            {card.estimatedCost} · {card.estimatedDuration}
          </p>
          {(card.nearbyPlaces?.length ?? 0) > 0 ? (
            <p className="mt-2 text-xs text-[var(--muted)]">{(card.nearbyPlaces ?? []).join(" · ")}</p>
          ) : null}
          <p className="mt-4 text-center text-xs text-[var(--muted)]">Drag or use the zones below</p>
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
          Save
        </button>
      </div>
    </div>
  );
}
