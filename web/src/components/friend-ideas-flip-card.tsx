"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { FriendTinderFace } from "@/components/friend-tinder-face";
import { Skeleton } from "@/components/ui/skeleton";
import type { SocialFriendEdge } from "@/types/social";
import { suggestionRowKey, type SuggestionItem } from "@/types/suggestion";

const SKELETON_SLIDE_COUNT = 6;

function IdeaSlideSkeleton() {
  return (
    <div className="flex min-h-full w-full flex-col justify-center gap-4 px-6 py-8" aria-hidden>
      <Skeleton className="h-7 w-[85%]" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[92%]" />
      <Skeleton className="h-4 w-[70%]" />
      <div className="mt-auto flex justify-end pt-6">
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  );
}

type FriendIdeasFlipCardProps = {
  friend: SocialFriendEdge;
  ideas: SuggestionItem[];
  ideasLoading: boolean;
  ideaSource?: "llm" | "fallback";
  reducedMotion: boolean;
  onPickIdea: (s: SuggestionItem) => void;
  onSaveIdea: (s: SuggestionItem) => void;
  savingId: string | null;
};

export function FriendIdeasFlipCard({
  friend,
  ideas,
  ideasLoading,
  ideaSource,
  reducedMotion,
  onPickIdea,
  onSaveIdea,
  savingId,
}: FriendIdeasFlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const slideCount = ideasLoading ? SKELETON_SLIDE_COUNT : ideas.length === 0 ? 1 : ideas.length;

  useEffect(() => {
    setFlipped(false);
    const delay = reducedMotion ? 0 : 380;
    const id = window.setTimeout(() => setFlipped(true), delay);
    return () => window.clearTimeout(id);
  }, [friend.counterpartyUid, reducedMotion]);

  useEffect(() => {
    setActiveIndex(0);
    const el = scrollRef.current;
    if (el) el.scrollTop = 0;
  }, [friend.counterpartyUid, ideasLoading, ideas]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || slideCount === 0) return;

    const slides = root.querySelectorAll<HTMLElement>("[data-snap-slide]");
    if (slides.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((e) => e.isIntersecting && e.target instanceof HTMLElement)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (best?.target instanceof HTMLElement) {
          const idx = Number(best.target.dataset.snapSlide);
          if (!Number.isNaN(idx)) setActiveIndex(idx);
        }
      },
      { root, threshold: [0.35, 0.55, 0.75] },
    );

    slides.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [slideCount, ideas, ideasLoading, friend.counterpartyUid]);

  const scrollToSlide = useCallback(
    (index: number) => {
      const root = scrollRef.current;
      if (!root) return;
      const target = root.querySelector<HTMLElement>(`[data-snap-slide="${index}"]`);
      if (!target) return;
      target.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start",
      });
    },
    [reducedMotion],
  );

  const flipMs = reducedMotion ? 0 : 700;

  return (
    <div className="mx-auto w-full max-w-md [perspective:1200px]">
      <div
        className="relative h-[min(70vh,520px)] w-full"
        style={{
          transformStyle: "preserve-3d",
          transition: reducedMotion ? undefined : `transform ${flipMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <div
          className="absolute inset-0 overflow-hidden rounded-2xl [backface-visibility:hidden]"
          style={{ WebkitBackfaceVisibility: "hidden" }}
        >
          <FriendTinderFace
            profile={friend.profile}
            fillHeight
            frameless
            className="h-full"
            footnote="Plan together — ideas on the next side."
          />
        </div>

        <div
          className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)] [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={{ WebkitBackfaceVisibility: "hidden" }}
        >
          <div className="border-b border-[var(--border)] px-5 py-4">
            <p className="font-display text-base font-semibold tracking-tight text-[var(--foreground)]">Hangout ideas</p>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
              Tap an idea to invite {friend.profile.displayName}
            </p>
            {ideaSource === "fallback" ? (
              <p className="mt-3 rounded-xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-2 text-sm leading-snug text-[var(--foreground)]">
                Offline ideas — AI wasn&apos;t reachable; these are curated fallbacks.
              </p>
            ) : null}
          </div>

          <motion.div
            className="relative min-h-0 flex-1"
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={reducedMotion ? false : { opacity: 1, y: 0 }}
            transition={reducedMotion ? undefined : { duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              ref={scrollRef}
              className="scrollbar-none h-full snap-y snap-mandatory overflow-y-auto overflow-x-hidden scroll-smooth"
              aria-label="Hangout ideas, swipe vertically"
            >
              {ideasLoading ? (
                Array.from({ length: SKELETON_SLIDE_COUNT }).map((_, i) => (
                  <div
                    key={i}
                    data-snap-slide={i}
                    className="box-border min-h-full snap-start snap-always border-b border-[var(--border)] last:border-b-0"
                  >
                    <IdeaSlideSkeleton />
                  </div>
                ))
              ) : ideas.length === 0 ? (
                <div
                  data-snap-slide={0}
                  className="box-border flex min-h-full snap-start snap-always flex-col items-center justify-center px-6 py-12"
                >
                  <p className="text-center text-sm leading-relaxed text-[var(--muted)]">No ideas yet.</p>
                </div>
              ) : (
                ideas.map((s, i) => {
                  const rowKey = suggestionRowKey(s);
                  const busy = savingId === rowKey;
                  return (
                    <div
                      key={rowKey}
                      data-snap-slide={i}
                      className="box-border min-h-full snap-start snap-always border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_2%,var(--card))] last:border-b-0"
                    >
                      <div className="flex min-h-full flex-col px-6 py-7">
                        <button
                          type="button"
                          className="flex min-h-0 flex-1 flex-col rounded-xl text-left outline-none transition ring-offset-2 ring-offset-[var(--card)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                          onClick={() => onPickIdea(s)}
                        >
                          <p className="text-lg font-semibold leading-snug tracking-tight text-[var(--foreground)]">{s.title}</p>
                          <div className="scrollbar-none mt-4 min-h-0 flex-1 overflow-y-auto">
                            <p className="text-sm leading-relaxed text-[var(--muted)]">{s.reason}</p>
                          </div>
                          <p className="mt-5 text-xs font-medium uppercase tracking-wider text-[var(--foreground)]">
                            {s.estimatedCost} · {s.estimatedDuration}
                          </p>
                        </button>
                        <div className="mt-6 flex justify-end border-t border-[var(--border)] pt-5">
                          <button
                            type="button"
                            disabled={busy}
                            className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] transition hover:text-[var(--foreground)] disabled:opacity-50"
                            onClick={() => void onSaveIdea(s)}
                          >
                            {busy ? "Saving…" : "Save for later"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {slideCount > 1 ? (
              <nav
                className="pointer-events-auto absolute right-3 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2.5"
                aria-label="Idea slides"
              >
                {Array.from({ length: slideCount }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to idea ${i + 1} of ${slideCount}`}
                    aria-current={i === activeIndex ? "true" : undefined}
                    onClick={() => scrollToSlide(i)}
                    className={`rounded-full transition-[transform,opacity] duration-200 ${
                      i === activeIndex
                        ? "h-2.5 w-2.5 scale-110 bg-[var(--foreground)] opacity-100"
                        : "h-2 w-2 bg-[var(--muted)] opacity-45 hover:opacity-80"
                    }`}
                  />
                ))}
              </nav>
            ) : null}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
