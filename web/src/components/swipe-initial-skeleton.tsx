import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder while friends list loads — matches Tinder card footprint. */
export function SwipeInitialSkeleton() {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="flex h-[min(70vh,520px)] min-h-[320px] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)]">
        <Skeleton className="min-h-[220px] flex-1 rounded-none opacity-90" />
        <div className="space-y-2 border-t border-[var(--border)] p-4">
          <Skeleton className="h-6 w-[70%]" />
          <Skeleton className="h-4 w-[40%]" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    </div>
  );
}
