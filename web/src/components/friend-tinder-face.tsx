import type { PublicProfile } from "@/types/social";
import { Skeleton } from "@/components/ui/skeleton";

export function photoUrlLooksValid(url: string): boolean {
  const t = url.trim();
  if (!t) return false;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

type FriendTinderFaceProps = {
  profile: PublicProfile;
  /** Small hint under username */
  footnote?: string;
  className?: string;
  /** Fill parent height (e.g. flip-card front) instead of default max-height cap. */
  fillHeight?: boolean;
  /** No outer border/shadow (parent provides frame). */
  frameless?: boolean;
};

/** Tinder-style upper photo + lower name stack; fixed aspect card shell. */
export function FriendTinderFace({
  profile,
  footnote,
  className = "",
  fillHeight = false,
  frameless = false,
}: FriendTinderFaceProps) {
  const showPhoto = photoUrlLooksValid(profile.photoURL);

  const frame =
    frameless
      ? "bg-[var(--card)]"
      : "rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)]";

  const shell = fillHeight
    ? `flex h-full min-h-0 w-full flex-col overflow-hidden ${frame}`
    : `flex max-h-[min(70vh,520px)] min-h-[320px] w-full max-w-md flex-col overflow-hidden ${frame}`;

  return (
    <div className={`${shell} ${className}`.trim()}>
      <div className="relative min-h-[200px] flex-1 bg-[color-mix(in_srgb,var(--foreground)_4%,var(--card))]">
        {showPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-supplied URL
          <img
            src={profile.photoURL.trim()}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6" aria-hidden>
            <Skeleton className="h-full w-full rounded-none opacity-90" />
          </div>
        )}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[color-mix(in_srgb,var(--card)_95%,transparent)] to-transparent"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 px-5 pb-6 pt-10">
          <h2 className="font-display text-2xl font-semibold leading-tight tracking-tight text-[var(--foreground)] drop-shadow-sm">
            {profile.displayName}
          </h2>
          <p className="mt-1.5 text-sm font-medium leading-snug text-[var(--muted)]">@{profile.username}</p>
          {footnote ? <p className="mt-3 max-w-[95%] text-xs leading-relaxed text-[var(--muted)]">{footnote}</p> : null}
        </div>
      </div>
    </div>
  );
}
