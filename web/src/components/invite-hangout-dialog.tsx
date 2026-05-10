"use client";

import { useEffect, useRef } from "react";
import type { SuggestionItem } from "@/types/suggestion";

type InviteHangoutDialogProps = {
  open: boolean;
  activity: SuggestionItem | null;
  inviteNote: string;
  onInviteNoteChange: (v: string) => void;
  onClose: () => void;
  onSend: () => void;
  sending: boolean;
};

export function InviteHangoutDialog({
  open,
  activity,
  inviteNote,
  onInviteNoteChange,
  onClose,
  onSend,
  sending,
}: InviteHangoutDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && activity) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [open, activity]);

  return (
    <dialog
      ref={ref}
      className="w-[min(100vw-2rem,28rem)] rounded-2xl border border-[var(--border)] bg-[var(--card)] p-0 text-[var(--foreground)] shadow-[var(--shadow-soft)] backdrop:bg-black/40"
      onClose={onClose}
    >
      {activity ? (
        <div className="p-6">
          <h2 className="font-display text-lg font-semibold tracking-tight">Send hangout invite</h2>
          <div className="mt-4">
            <p className="font-medium text-[var(--foreground)]">{activity.title}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{activity.reason}</p>
            <p className="mt-2 text-sm text-[var(--foreground)]">
              {activity.estimatedCost} · {activity.estimatedDuration}
            </p>
          </div>
          <label className="mt-4 block text-sm">
            <span className="text-[var(--muted)]">Optional note</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
              rows={3}
              value={inviteNote}
              onChange={(e) => onInviteNoteChange(e.target.value)}
              placeholder="e.g. Want to do this Saturday?"
            />
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={sending}
              onClick={() => void onSend()}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {sending ? "Sending…" : "Send invite"}
            </button>
            <button
              type="button"
              disabled={sending}
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
