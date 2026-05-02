"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { FriendDetailResponse } from "@/types/social";

export default function FriendProfileViewPage() {
  const params = useParams();
  const counterpartyUid = typeof params.id === "string" ? params.id : "";
  const [detail, setDetail] = useState<FriendDetailResponse | null | undefined>(undefined);

  const load = useCallback(async () => {
    if (!counterpartyUid) return;
    try {
      const d = await apiFetch<FriendDetailResponse>(
        `/api/friends/${encodeURIComponent(counterpartyUid)}`,
        { method: "GET" },
      );
      setDetail(d);
    } catch {
      setDetail(null);
    }
  }, [counterpartyUid]);

  useEffect(() => {
    void load();
  }, [load]);

  if (detail === undefined) {
    return <p className="text-[var(--muted)]">Loading…</p>;
  }

  if (detail === null) {
    return (
      <div className="space-y-4">
        <p className="text-[var(--muted)]">Friend not found or you’re not connected.</p>
        <Link href="/dashboard/friends" className="text-[var(--accent)] hover:underline">
          Back to friends
        </Link>
      </div>
    );
  }

  const { profile, prefs } = detail;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">{profile.displayName}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">@{profile.username}</p>
        <p className="mt-3 text-sm text-[var(--muted)]">
          <Link href="/dashboard/friends" className="text-[var(--accent)] hover:underline">
            Friends
          </Link>
          {" · "}
          <Link
            href={`/dashboard/swipe?friend=${encodeURIComponent(counterpartyUid)}`}
            className="text-[var(--accent)] hover:underline"
          >
            Swipe ideas
          </Link>
          {" · "}
          <Link href="/dashboard/profile" className="text-[var(--accent)] hover:underline">
            Edit your profile
          </Link>
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Public</h2>
        <dl className="mt-3 grid gap-2 text-sm">
          <div>
            <dt className="text-[var(--muted)]">Display name</dt>
            <dd className="text-[var(--foreground)]">{profile.displayName}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Username</dt>
            <dd className="text-[var(--foreground)]">@{profile.username}</dd>
          </div>
          {profile.photoURL ? (
            <div>
              <dt className="text-[var(--muted)]">Photo</dt>
              <dd>
                <a href={profile.photoURL} className="text-[var(--accent)] hover:underline" target="_blank" rel="noreferrer">
                  Link
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Hangout prefs (for planning)</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">What they saved on fricker — used for AI suggestions between you two.</p>
        <dl className="mt-4 grid gap-3 text-sm">
          {[
            ["Nickname", prefs.nickname],
            ["Hobbies", prefs.hobbies],
            ["Favourite foods", prefs.favouriteFoods],
            ["Favourite activities", prefs.favouriteActivities],
            ["Personality notes", prefs.personalityNotes],
            ["Budget", prefs.budgetLevel],
            ["Availability", prefs.availabilityNotes],
            ["Area", prefs.address],
          ].map(([label, val]) =>
            val ? (
              <div key={String(label)}>
                <dt className="text-[var(--muted)]">{label}</dt>
                <dd className="text-[var(--foreground)]">{val}</dd>
              </div>
            ) : null,
          )}
          {prefs.tags.length > 0 ? (
            <div>
              <dt className="text-[var(--muted)]">Tags</dt>
              <dd className="text-[var(--foreground)]">{prefs.tags.join(", ")}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </div>
  );
}
