import { randomUUID } from "node:crypto";
import type { HangoutInviteDoc } from "../schemas/hangoutInvite.js";
import { friendshipId } from "../services/social/ids.js";
import { MOCK_UIDS } from "./uids.js";

/** Process-wide invite list so inbox/outbox work across different mock viewer sessions. */
const globalInvites: HangoutInviteDoc[] = [];

export function mockInvitesListAll(): HangoutInviteDoc[] {
  return globalInvites;
}

export function mockInvitesPush(doc: HangoutInviteDoc): void {
  globalInvites.push(doc);
}

export function mockInvitesFindById(id: string): HangoutInviteDoc | undefined {
  return globalInvites.find((i) => i.id === id);
}

/** One pending invite from Sam → viewer when they’re friends (Invites tab demo). */
export function seedDemoInboxInviteForViewer(viewerUid: string, friendships: Set<string>): void {
  if (!friendships.has(friendshipId(viewerUid, MOCK_UIDS.sam))) return;
  const dup = globalInvites.some(
    (i) =>
      i.toUid === viewerUid &&
      i.fromUid === MOCK_UIDS.sam &&
      i.status === "pending" &&
      i.activity.title === "Coffee catch-up (mock)",
  );
  if (dup) return;
  const now = new Date().toISOString();
  globalInvites.push({
    id: randomUUID(),
    fromUid: MOCK_UIDS.sam,
    toUid: viewerUid,
    activity: {
      title: "Coffee catch-up (mock)",
      reason: "Seed invite for Invites tab demo.",
      estimatedCost: "$",
      estimatedDuration: "1 hour",
      nearbyPlaces: [],
    },
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });
}
