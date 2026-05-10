import { randomUUID } from "node:crypto";
import type { HangoutHistoryCreate } from "../schemas/history.js";
import type { HangoutInviteCreate, HangoutInviteDoc } from "../schemas/hangoutInvite.js";
import type { HangoutPrefsFields } from "../schemas/hangoutPrefs.js";
import type { SavedSuggestionCreate } from "../schemas/savedSuggestion.js";
import type { UsersPublicDoc, UsersPublicWrite } from "../schemas/usersPublic.js";
import { friendRequestDocId, friendshipId, normalizeUsername } from "../services/social/ids.js";
import { mockInvitesFindById, mockInvitesListAll, mockInvitesPush } from "./mock-invites-store.js";
import { ensureMockSession, type MockSession } from "./store.js";

function rowPublicProfiles(s: MockSession): UsersPublicDoc[] {
  return Array.from(s.profiles.values()).map((r) => r.public);
}

export function mockProfileMe(viewerUid: string) {
  const s = ensureMockSession(viewerUid);
  const row = s.profiles.get(viewerUid)!;
  return { uid: viewerUid, public: row.public, prefs: row.prefs };
}

export function mockPatchPrefs(viewerUid: string, prefs: HangoutPrefsFields) {
  const s = ensureMockSession(viewerUid);
  const row = s.profiles.get(viewerUid);
  if (!row) throw new Error("Profile missing");
  row.prefs = { ...prefs, tags: [...prefs.tags] };
  const now = new Date().toISOString();
  row.public = { ...row.public, updatedAt: now };
}

export function mockPostPublic(viewerUid: string, body: UsersPublicWrite) {
  const s = ensureMockSession(viewerUid);
  const usernameLower = normalizeUsername(body.username);
  const existingOwner = s.usernameToUid.get(usernameLower);
  if (existingOwner && existingOwner !== viewerUid) {
    const err = new Error("USERNAME_TAKEN");
    throw err;
  }
  const row = s.profiles.get(viewerUid)!;
  const prevLower = row.public.usernameLower;
  if (prevLower && prevLower !== usernameLower) {
    s.usernameToUid.delete(prevLower);
  }
  const now = new Date().toISOString();
  row.public = {
    uid: viewerUid,
    username: body.username.trim(),
    usernameLower,
    displayName: body.displayName.trim(),
    photoURL: body.photoURL ?? "",
    updatedAt: now,
  };
  s.usernameToUid.set(usernameLower, viewerUid);
  return row.public;
}

export function mockListFriends(viewerUid: string) {
  const s = ensureMockSession(viewerUid);
  const friends = [];
  for (let i = 0; i < s.friendOrder.length; i++) {
    const otherUid = s.friendOrder[i];
    if (!s.friendships.has(friendshipId(viewerUid, otherUid))) continue;
    const pub = s.profiles.get(otherUid)?.public;
    if (!pub) continue;
    friends.push({
      counterpartyUid: otherUid,
      sortRank: i,
      profile: pub,
      lastAcceptedInviteAt: undefined as string | undefined,
    });
  }
  return friends;
}

export function mockRemoveFriendship(viewerUid: string, counterpartyUid: string) {
  const s = ensureMockSession(viewerUid);
  if (viewerUid === counterpartyUid) throw new Error("Invalid counterparty");
  if (!s.friendships.has(friendshipId(viewerUid, counterpartyUid))) {
    throw new Error("Not friends with this user");
  }
  s.friendships.delete(friendshipId(viewerUid, counterpartyUid));
  s.friendOrder = s.friendOrder.filter((id) => id !== counterpartyUid);
  s.friendRequests = s.friendRequests.filter(
    (r) =>
      !(
        r.status === "pending" &&
        ((r.fromUid === viewerUid && r.toUid === counterpartyUid) ||
          (r.fromUid === counterpartyUid && r.toUid === viewerUid))
      ),
  );
}

export function mockGetFriendDetail(viewerUid: string, counterpartyUid: string) {
  const s = ensureMockSession(viewerUid);
  if (!s.friendships.has(friendshipId(viewerUid, counterpartyUid))) return null;
  const pub = s.profiles.get(counterpartyUid)?.public ?? null;
  if (!pub) return null;
  const prefs = mockGetPrivatePrefs(viewerUid, counterpartyUid);
  return { counterpartyUid, profile: pub, prefs };
}

export function mockReorderFriends(viewerUid: string, ordered: string[]) {
  const s = ensureMockSession(viewerUid);
  const ok = new Set(
    ordered.filter((id) => s.friendships.has(friendshipId(viewerUid, id))),
  );
  s.friendOrder = ordered.filter((id) => ok.has(id));
}

export function mockListHistory(viewerUid: string) {
  const s = ensureMockSession(viewerUid);
  return [...s.history].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function mockPostHistory(viewerUid: string, body: HangoutHistoryCreate) {
  const s = ensureMockSession(viewerUid);
  const now = new Date().toISOString();
  const row = { id: randomUUID(), ...body, createdAt: now };
  s.history.unshift(row);
  return row;
}

export function mockListSaved(viewerUid: string) {
  const s = ensureMockSession(viewerUid);
  return [...s.saved].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function mockPostSaved(viewerUid: string, body: SavedSuggestionCreate) {
  const s = ensureMockSession(viewerUid);
  const now = new Date().toISOString();
  const row = { id: randomUUID(), ...body, createdAt: now };
  s.saved.unshift(row);
  return row;
}

export function mockDeleteSaved(viewerUid: string, id: string) {
  const s = ensureMockSession(viewerUid);
  const idx = s.saved.findIndex((x) => x.id === id);
  if (idx === -1) return false;
  s.saved.splice(idx, 1);
  return true;
}

export function mockSearchUsers(viewerUid: string, q: string) {
  const s = ensureMockSession(viewerUid);
  const prefix = normalizeUsername(q);
  if (prefix.length < 2) return [];
  return rowPublicProfiles(s).filter((p) => p.usernameLower.startsWith(prefix));
}

export function mockGetUserByUsername(viewerUid: string, username: string) {
  const s = ensureMockSession(viewerUid);
  const uid = s.usernameToUid.get(normalizeUsername(username));
  if (!uid) return null;
  return s.profiles.get(uid)?.public ?? null;
}

export function mockUidForUsername(viewerUid: string, username: string): string | null {
  const s = ensureMockSession(viewerUid);
  return s.usernameToUid.get(normalizeUsername(username)) ?? null;
}

export function mockAssertFriendship(viewerUid: string, a: string, b: string) {
  const s = ensureMockSession(viewerUid);
  return s.friendships.has(friendshipId(a, b));
}

export function mockGetPublicProfile(viewerUid: string, targetUid: string) {
  const s = ensureMockSession(viewerUid);
  return s.profiles.get(targetUid)?.public ?? null;
}

export function mockGetPrivatePrefs(viewerUid: string, targetUid: string): HangoutPrefsFields {
  const s = ensureMockSession(viewerUid);
  return (
    s.profiles.get(targetUid)?.prefs ?? {
      nickname: "",
      hobbies: "",
      favouriteFoods: "",
      favouriteActivities: "",
      personalityNotes: "",
      budgetLevel: "",
      availabilityNotes: "",
      tags: [],
      address: "",
    }
  );
}

export function mockListIncomingRequests(viewerUid: string) {
  const s = ensureMockSession(viewerUid);
  return s.friendRequests
    .filter((r) => r.toUid === viewerUid && r.status === "pending")
    .map((r) => ({
      id: r.id,
      fromUid: r.fromUid,
      profile: s.profiles.get(r.fromUid)?.public ?? null,
    }));
}

export function mockListOutgoingRequests(viewerUid: string) {
  const s = ensureMockSession(viewerUid);
  return s.friendRequests
    .filter((r) => r.fromUid === viewerUid && r.status === "pending")
    .map((r) => ({
      id: r.id,
      toUid: r.toUid,
      profile: s.profiles.get(r.toUid)?.public ?? null,
    }));
}

export function mockCreateFriendRequest(viewerUid: string, toUsername: string) {
  const s = ensureMockSession(viewerUid);
  const toUid = mockUidForUsername(viewerUid, toUsername);
  if (!toUid) throw new Error("User not found");
  if (toUid === viewerUid) throw new Error("Cannot friend yourself");
  if (s.friendships.has(friendshipId(viewerUid, toUid))) throw new Error("Already friends");
  const id = friendRequestDocId(viewerUid, toUid);
  const dup = s.friendRequests.find((r) => r.id === id && r.status === "pending");
  if (dup) throw new Error("Request already pending");
  const now = new Date().toISOString();
  s.friendRequests.push({
    id,
    fromUid: viewerUid,
    toUid,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });
  return { toUid };
}

export function mockAcceptFriendRequest(viewerUid: string, fromUid: string) {
  const s = ensureMockSession(viewerUid);
  const id = friendRequestDocId(fromUid, viewerUid);
  const r = s.friendRequests.find((x) => x.id === id);
  if (!r) throw new Error("Request not found");
  if (r.toUid !== viewerUid || r.fromUid !== fromUid) throw new Error("Request not found");
  if (r.status !== "pending") throw new Error("Request not pending");
  const now = new Date().toISOString();
  r.status = "accepted";
  r.updatedAt = now;
  s.friendships.add(friendshipId(fromUid, viewerUid));
  if (!s.friendOrder.includes(fromUid)) s.friendOrder.push(fromUid);
}

export function mockDeclineFriendRequest(viewerUid: string, fromUid: string) {
  const s = ensureMockSession(viewerUid);
  const id = friendRequestDocId(fromUid, viewerUid);
  const r = s.friendRequests.find((x) => x.id === id);
  if (!r) throw new Error("Request not found");
  if (r.toUid !== viewerUid || r.fromUid !== fromUid) throw new Error("Request not found");
  r.status = "declined";
  r.updatedAt = new Date().toISOString();
}

function mockAppendPairToBottomOfFriendOrder(fromUid: string, toUid: string) {
  const bump = (viewer: string, other: string) => {
    const s = ensureMockSession(viewer);
    if (!s.friendships.has(friendshipId(viewer, other))) return;
    s.friendOrder = [...s.friendOrder.filter((id) => id !== other), other];
  };
  bump(fromUid, toUid);
  bump(toUid, fromUid);
}

export function mockCreateHangoutInvite(viewerUid: string, body: HangoutInviteCreate) {
  const s = ensureMockSession(viewerUid);
  if (!s.friendships.has(friendshipId(viewerUid, body.counterpartyUid))) {
    throw new Error("Not friends with this user");
  }
  const now = new Date().toISOString();
  const id = randomUUID();
  const msg = body.message?.trim();
  const doc: HangoutInviteDoc = {
    id,
    fromUid: viewerUid,
    toUid: body.counterpartyUid,
    activity: body.activity,
    status: "pending",
    createdAt: now,
    updatedAt: now,
    ...(msg ? { message: msg } : {}),
  };
  mockInvitesPush(doc);
  return id;
}

export function mockAcceptHangoutInvite(viewerUid: string, inviteId: string) {
  ensureMockSession(viewerUid);
  const inv = mockInvitesFindById(inviteId);
  if (!inv) throw new Error("Invite not found");
  if (inv.toUid !== viewerUid) throw new Error("Forbidden");
  if (inv.status !== "pending") throw new Error("Invite not pending");
  const now = new Date().toISOString();
  inv.status = "accepted";
  inv.updatedAt = now;
  inv.respondedAt = now;
  mockAppendPairToBottomOfFriendOrder(inv.fromUid, inv.toUid);
}

export function mockDeclineHangoutInvite(viewerUid: string, inviteId: string) {
  ensureMockSession(viewerUid);
  const inv = mockInvitesFindById(inviteId);
  if (!inv) throw new Error("Invite not found");
  if (inv.toUid !== viewerUid) throw new Error("Forbidden");
  if (inv.status !== "pending") throw new Error("Invite not pending");
  const now = new Date().toISOString();
  inv.status = "declined";
  inv.updatedAt = now;
  inv.respondedAt = now;
}

export function mockListInviteInbox(viewerUid: string) {
  ensureMockSession(viewerUid);
  return mockInvitesListAll().filter((i) => i.toUid === viewerUid && i.status === "pending");
}

export function mockListInviteOutbox(viewerUid: string) {
  ensureMockSession(viewerUid);
  return mockInvitesListAll()
    .filter((i) => i.fromUid === viewerUid)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
