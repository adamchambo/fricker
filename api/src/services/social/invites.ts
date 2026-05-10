import { appendFriendEdgesToBottom, assertFriendship } from "./graph.js";
import type { SuggestionItem } from "../../schemas/suggestion.js";
import { db } from "../firebase-admin.js";

function inviteCreatedAtMs(data: { createdAt?: unknown }): number {
  const v = data.createdAt;
  if (v == null) return 0;
  if (typeof v === "string") return Date.parse(v) || 0;
  if (typeof v === "object" && v !== null && "toDate" in v && typeof (v as { toDate?: unknown }).toDate === "function") {
    return (v as { toDate: () => Date }).toDate().getTime();
  }
  return 0;
}

export async function createHangoutInvite(
  fromUid: string,
  toUid: string,
  activity: SuggestionItem,
  message?: string,
): Promise<string> {
  const ok = await assertFriendship(fromUid, toUid);
  if (!ok) throw new Error("Not friends with this user");
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    fromUid,
    toUid,
    activity,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  const trimmed = message?.trim();
  if (trimmed) payload.message = trimmed;
  const ref = await db.collection("hangoutInvites").add(payload);
  return ref.id;
}

export async function acceptHangoutInvite(viewerUid: string, inviteId: string): Promise<void> {
  const ref = db.collection("hangoutInvites").doc(inviteId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Invite not found");
  const d = snap.data()!;
  if (d.toUid !== viewerUid) throw new Error("Forbidden");
  if (d.status !== "pending") throw new Error("Invite not pending");
  const now = new Date().toISOString();
  await ref.update({ status: "accepted", updatedAt: now, respondedAt: now });
  await appendFriendEdgesToBottom(String(d.fromUid), String(d.toUid));
}

export async function declineHangoutInvite(viewerUid: string, inviteId: string): Promise<void> {
  const ref = db.collection("hangoutInvites").doc(inviteId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Invite not found");
  const d = snap.data()!;
  if (d.toUid !== viewerUid) throw new Error("Forbidden");
  if (d.status !== "pending") throw new Error("Invite not pending");
  const now = new Date().toISOString();
  await ref.update({ status: "declined", updatedAt: now, respondedAt: now });
}

export async function listInviteInbox(uid: string) {
  const snap = await db.collection("hangoutInvites").where("toUid", "==", uid).where("status", "==", "pending").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listInviteOutbox(uid: string) {
  // Equality-only query uses the automatic single-field index. Sorting here avoids a
  // composite index (fromUid + createdAt). If outbox volume grows large, add that index
  // and switch back to orderBy + limit in Firestore.
  const snap = await db.collection("hangoutInvites").where("fromUid", "==", uid).get();
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  rows.sort((a, b) => inviteCreatedAtMs(b as { createdAt?: unknown }) - inviteCreatedAtMs(a as { createdAt?: unknown }));
  return rows.slice(0, 50);
}
