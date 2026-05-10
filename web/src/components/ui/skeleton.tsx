import type { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  /** When true, omit pulse (static block). */
  staticBlock?: boolean;
};

export function Skeleton({ className = "", staticBlock = false, ...rest }: SkeletonProps) {
  return (
    <div
      className={`rounded-md bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)] ${staticBlock ? "" : "animate-pulse"} ${className}`.trim()}
      aria-hidden
      {...rest}
    />
  );
}
