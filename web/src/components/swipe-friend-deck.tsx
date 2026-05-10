"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { FriendTinderFace } from "@/components/friend-tinder-face";
import type { SocialFriendEdge } from "@/types/social";

const SWIPE_THRESHOLD_PX = 72;
const EXIT_MS = 0.28;
const EXIT_EASE = [0.22, 1, 0.36, 1] as const;
const EXIT_X_PX = 520;
const SPRING = { type: "spring" as const, stiffness: 420, damping: 32, mass: 0.85 };

type SwipeFriendDeckProps = {
  friend: SocialFriendEdge | null;
  onSkip: () => void;
  onChoose: () => Promise<void>;
  reducedMotion: boolean;
};

export function SwipeFriendDeck({ friend, onSkip, onChoose, reducedMotion }: SwipeFriendDeckProps) {
  const x = useMotionValue(0);
  const rotate = useMotionValue(0);
  const opacity = useMotionValue(1);
  const scale = useMotionValue(1);

  const noHintOpacity = useTransform(x, [-130, -24, 0], [0.92, 0.35, 0], { clamp: true });
  const yesHintOpacity = useTransform(x, [0, 24, 130], [0, 0.35, 0.92], { clamp: true });

  const startXRef = useRef(0);
  const activePointerRef = useRef<number | null>(null);
  const exitingRef = useRef(false);
  const exitSeqRef = useRef(0);

  const [blockPointer, setBlockPointer] = useState(false);

  const resetMotion = useCallback(() => {
    x.set(0);
    rotate.set(0);
    opacity.set(1);
    scale.set(1);
    exitingRef.current = false;
    setBlockPointer(false);
  }, [opacity, rotate, scale, x]);

  useEffect(() => {
    if (!friend) {
      resetMotion();
    }
  }, [friend, resetMotion]);

  const finishLeft = useCallback(() => {
    onSkip();
    resetMotion();
  }, [onSkip, resetMotion]);

  const finishRight = useCallback(() => {
    void onChoose().finally(() => {
      resetMotion();
    });
  }, [onChoose, resetMotion]);

  const runExit = useCallback(
    (dir: "left" | "right") => {
      if (!friend || exitingRef.current) return;
      exitingRef.current = true;
      setBlockPointer(true);
      const seq = ++exitSeqRef.current;
      const targetX = dir === "left" ? -EXIT_X_PX : EXIT_X_PX;
      const targetRot = dir === "left" ? -14 : 14;

      if (reducedMotion) {
        if (dir === "left") finishLeft();
        else void finishRight();
        return;
      }

      const done = () => {
        if (exitSeqRef.current !== seq) return;
        if (dir === "left") finishLeft();
        else void finishRight();
      };

      void Promise.all([
        animate(x, targetX, { duration: EXIT_MS, ease: EXIT_EASE }),
        animate(rotate, targetRot, { duration: EXIT_MS, ease: EXIT_EASE }),
        animate(opacity, 0, { duration: EXIT_MS, ease: "easeOut" }),
        animate(scale, 0.96, { duration: EXIT_MS, ease: EXIT_EASE }),
      ]).then(done);
    },
    [friend, reducedMotion, finishLeft, finishRight, x, rotate, opacity, scale],
  );

  const commitDirection = useCallback(
    (dir: "left" | "right") => {
      if (!friend || exitingRef.current) return;
      if (reducedMotion) {
        if (dir === "left") finishLeft();
        else void finishRight();
        return;
      }
      runExit(dir);
    },
    [friend, reducedMotion, finishLeft, finishRight, runExit],
  );

  function onPointerDown(e: React.PointerEvent) {
    if (!friend || exitingRef.current || blockPointer) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    activePointerRef.current = e.pointerId;
    startXRef.current = e.clientX;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!friend || exitingRef.current || activePointerRef.current !== e.pointerId) return;
    const dx = e.clientX - startXRef.current;
    x.set(dx);
    if (!reducedMotion) {
      rotate.set(dx * 0.045);
      const s = 1 - Math.min(0.04, Math.abs(dx) / 900);
      scale.set(s);
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!friend || exitingRef.current || activePointerRef.current !== e.pointerId) return;
    activePointerRef.current = null;
    const dx = e.clientX - startXRef.current;
    if (dx > SWIPE_THRESHOLD_PX) {
      commitDirection("right");
    } else if (dx < -SWIPE_THRESHOLD_PX) {
      commitDirection("left");
    } else if (reducedMotion) {
      x.set(0);
      rotate.set(0);
      scale.set(1);
    } else {
      void Promise.all([
        animate(x, 0, SPRING),
        animate(rotate, 0, SPRING),
        animate(scale, 1, SPRING),
      ]);
    }
  }

  function onPointerCancel(e: React.PointerEvent) {
    if (activePointerRef.current === e.pointerId) {
      activePointerRef.current = null;
      if (reducedMotion) {
        x.set(0);
        rotate.set(0);
        scale.set(1);
      } else {
        void Promise.all([animate(x, 0, SPRING), animate(rotate, 0, SPRING), animate(scale, 1, SPRING)]);
      }
    }
  }

  if (!friend) return null;

  return (
    <div className="mx-auto w-full max-w-md">
      <motion.div
        role="presentation"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        className="cursor-grab touch-none active:cursor-grabbing"
        style={{
          x,
          rotate,
          opacity,
          scale,
        }}
      >
        <div className="relative overflow-hidden rounded-2xl">
          <motion.div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-start rounded-2xl pl-5"
            style={{ opacity: reducedMotion ? 0 : noHintOpacity }}
            aria-hidden
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[color-mix(in_srgb,var(--danger)_42%,transparent)] to-transparent" />
            <span className="relative rotate-[-14deg] rounded-lg border-[3px] border-[color-mix(in_srgb,var(--danger)_85%,transparent)] bg-[color-mix(in_srgb,var(--card)_55%,transparent)] px-3 py-1.5 font-display text-lg font-bold uppercase tracking-[0.12em] text-[var(--danger)] shadow-sm backdrop-blur-[2px]">
              Skip
            </span>
          </motion.div>
          <motion.div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-end rounded-2xl pr-5"
            style={{ opacity: reducedMotion ? 0 : yesHintOpacity }}
            aria-hidden
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-l from-[color-mix(in_srgb,#16a34a_38%,transparent)] to-transparent" />
            <span className="relative rotate-[14deg] rounded-lg border-[3px] border-[color-mix(in_srgb,#16a34a_80%,transparent)] bg-[color-mix(in_srgb,var(--card)_55%,transparent)] px-3 py-1.5 font-display text-lg font-bold uppercase tracking-[0.12em] text-[#15803d] shadow-sm backdrop-blur-[2px] dark:text-[#4ade80]">
              Plan
            </span>
          </motion.div>
          <FriendTinderFace
            profile={friend.profile}
            footnote="Swipe left to skip · Swipe right to plan together"
          />
        </div>
      </motion.div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <button
          type="button"
          className="rounded-xl border border-[var(--border)] bg-[var(--background)] py-4 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--card)]"
          onClick={() => commitDirection("left")}
          disabled={blockPointer}
        >
          Skip
        </button>
        <button
          type="button"
          className="rounded-xl bg-[var(--accent)] py-4 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          onClick={() => commitDirection("right")}
          disabled={blockPointer}
        >
          Choose
        </button>
      </div>
    </div>
  );
}
