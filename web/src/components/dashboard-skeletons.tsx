import { Skeleton } from "@/components/ui/skeleton";

export function FriendsListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul className="space-y-3" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Skeleton className="h-8 w-10 shrink-0 rounded border border-[var(--border)]" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-4 w-[min(12rem,50vw)]" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function FriendRequestsSkeleton() {
  const Row = () => (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3 last:border-0">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-28" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
  return (
    <div className="space-y-6" aria-hidden>
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <Skeleton className="h-5 w-24" />
        <div className="mt-4 space-y-3">
          <Row />
          <Row />
        </div>
      </section>
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <Skeleton className="h-5 w-28" />
        <div className="mt-4 space-y-3">
          <Row />
        </div>
      </section>
    </div>
  );
}

function InviteCardSkeleton() {
  return (
    <li className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <Skeleton className="h-5 w-[75%] max-w-xs" />
      <Skeleton className="mt-2 h-3 w-full max-w-md" />
      <Skeleton className="mt-2 h-3 w-48" />
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </li>
  );
}

export function InvitesPageSkeleton() {
  return (
    <div className="space-y-8" aria-hidden>
      <section>
        <Skeleton className="h-5 w-20" />
        <ul className="mt-3 space-y-3">
          <InviteCardSkeleton />
          <InviteCardSkeleton />
        </ul>
      </section>
      <section>
        <Skeleton className="h-5 w-16" />
        <ul className="mt-3 space-y-3">
          <InviteCardSkeleton />
        </ul>
      </section>
    </div>
  );
}

function ProfileFormBlockSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <Skeleton className="h-5 w-40" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <Skeleton className="mt-4 h-10 w-40 rounded-lg" />
    </div>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className="space-y-8" aria-hidden>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-lg" />
        <Skeleton className="h-4 w-32" />
      </div>
      <ProfileFormBlockSkeleton />
      <ProfileFormBlockSkeleton />
    </div>
  );
}
