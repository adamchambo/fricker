"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { SavedSuggestion } from "@/types/saved";

type SavedResponse = { savedSuggestions: SavedSuggestion[] };

export default function SavedSuggestionsPage() {
  const [items, setItems] = useState<SavedSuggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await apiFetch<SavedResponse>("/api/saved-suggestions", { method: "GET" });
      setItems(res.savedSuggestions);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(id: string) {
    if (!confirm("Remove this saved suggestion?")) return;
    try {
      await apiFetch(`/api/saved-suggestions/${id}`, { method: "DELETE" });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Saved suggestions</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Ideas you want to keep for later.</p>
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {items === null ? (
        <p className="text-[var(--muted)]">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] px-6 py-10 text-center text-sm text-[var(--muted)]">
          No saved suggestions yet. Open{" "}
          <Link href="/dashboard/swipe" className="text-[var(--accent)] hover:underline">
            Swipe
          </Link>
          , get ideas, then tap Save on a card.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((s) => (
            <li key={s.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <h2 className="font-medium text-[var(--foreground)]">{s.title}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{s.reason}</p>
              <p className="mt-2 text-sm text-[var(--foreground)]">
                {s.estimatedCost} · {s.estimatedDuration}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="text-sm text-red-500 hover:underline" onClick={() => void remove(s.id)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
