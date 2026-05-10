import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden px-5 py-16 sm:px-10 lg:px-16">
      {/*
        Background decorations (purely visual):
        - Back sheet: second “page” behind the main hero so the layout feels like a desk planner, not a centered modal.
        - Front sheet: main tilted card with a terracotta binding strip (reads as notebook margin / tab, not random chrome).
        - Glow: soft accent bloom so the warm palette has depth without a gradient cliché.
      */}
      <div
        className="pointer-events-none absolute -right-10 top-[5.5rem] hidden h-[19rem] w-[min(48vw,26rem)] rotate-[5deg] rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-elevated)] opacity-70 shadow-[var(--shadow-soft)] md:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-8 top-28 hidden h-72 w-[min(52vw,28rem)] rotate-[4deg] rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)] md:block"
        aria-hidden
      >
        <div
          className="absolute bottom-6 left-5 top-6 w-[5px] rounded-full bg-[color-mix(in_srgb,var(--accent)_55%,var(--border))]"
          aria-hidden
        />
      </div>
      <div
        className="pointer-events-none absolute bottom-14 left-[-14%] h-36 w-[min(68vw,20rem)] rotate-[-8deg] rounded-[2rem] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] blur-2xl md:left-[-6%]"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-3xl">
        <p className="hangout-eyebrow animate-fade-up opacity-0 [animation-delay:40ms]">
          The friend picker · real people, real plans
        </p>

        <div className="mt-8 grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
          <div className="min-w-0">
            <h1 className="font-display text-[clamp(2.75rem,8vw,4.35rem)] font-bold leading-[0.95] tracking-tight text-[var(--foreground)] animate-fade-up opacity-0 [animation-delay:90ms]">
              fricker
            </h1>
            <div className="relative mt-8 max-w-lg animate-fade-up opacity-0 [animation-delay:160ms]">
              <span className="absolute left-0 top-0 h-full w-[3px] rounded-full bg-[var(--accent)]" aria-hidden />
              <p className="pl-6 font-sans text-lg leading-relaxed text-[var(--muted)]">
                Choose who you want to see next, swipe ideas that fit you both, then send a plan they can accept or pass — fricker keeps it about picking friends, not scrolling feeds.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:pb-1 animate-fade-up opacity-0 [animation-delay:220ms]">
            <Link href="/login" className="hangout-btn-primary inline-flex justify-center text-center">
              Log in
            </Link>
            <Link href="/register" className="hangout-btn-ghost inline-flex justify-center text-center">
              Create account
            </Link>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[var(--border)] pt-8 font-sans text-sm text-[var(--muted)] animate-fade-up opacity-0 [animation-delay:300ms]">
          <span>Username search · friend requests · invites you both control.</span>
          <Link href="/dashboard/swipe" className="hangout-link text-[var(--foreground)]">
            Open app →
          </Link>
        </div>
      </div>
    </div>
  );
}
