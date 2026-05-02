import { FieldPath } from "firebase-admin/firestore";
import { INVITE_ACCEPT_SORT_APPEND, TRACK_LAST_ACCEPTED_ON_EDGE } from "../../config/ranking.js";
import type { HangoutPrefsFields } from "../../schemas/hangoutPrefs.js";
import type { UsersPublicDoc } from "../../schemas/usersPublic.js";
import { friendshipId, friendRequestDocId, normalizeUsername } from "./ids.js";
import { getPrivatePrefs, getPublicProfile } from "./profiles.js";
import { db } from "../firebase-admin.js";

export async function uidForUsername(usernameLower: string): Promise<string | null> {
  const doc = await db.collection("usernames").doc(usernameLower).get();
  if (!doc.exists) return null;
  const uid = doc.data()?.uid;
  return typeof uid === "string" ? uid : null;
}

export async function assertFriendship(uidA: string, uidB: string): Promise<boolean> {
  const fid = friendshipId(uidA, uidB);
  const doc = await db.collection("friendships").doc(fid).get();
  return doc.exists;
}

async function maxSortRank(uid: string): Promise<number> {
  const snap = await db.collection("users").doc(uid).collection("friendEdges").orderBy("sortRank", "desc").limit(1).get();
  if (snap.empty) return -1;
  const v = snap.docs[0]?.data()?.sortRank;
  return typeof v === "number" ? v : -1;
}

export async function appendFriendEdgesToBottom(uidA: string, uidB: string): Promise<void> {
  if (!INVITE_ACCEPT_SORT_APPEND) return;
  const maxA = await maxSortRank(uidA);
  const maxB = await maxSortRank(uidB);
  const batch = db.batch();
  const edgeA = db.collection("users").doc(uidA).collection("friendEdges").doc(uidB);
  const edgeB = db.collection("users").doc(uidB).collection("friendEdges").doc(uidA);
  const now = new Date().toISOString();
  const fa = await edgeA.get();
  const fb = await edgeB.get();
  if (!fa.exists || !fb.exists) return;
  batch.update(edgeA, {
    sortRank: maxA + 1,
    updatedAt: now,
    ...(TRACK_LAST_ACCEPTED_ON_EDGE ? { lastAcceptedInviteAt: now } : {}),
  });
  batch.update(edgeB, {
    sortRank: maxB + 1,
    updatedAt: now,
    ...(TRACK_LAST_ACCEPTED_ON_EDGE ? { lastAcceptedInviteAt: now } : {}),
  });
  await batch.commit();
}

export async function createFriendRequest(fromUid: string, toUsername: string): Promise<{ toUid: string }> {
  const uname = normalizeUsername(toUsername);
  const toUid = await uidForUsername(uname);
  if (!toUid) {
    throw new Error("User not found");
  }
  if (toUid === fromUid) {
    throw new Error("Cannot friend yourself");
  }
  const fid = friendshipId(fromUid, toUid);
  const existingFriendship = await db.collection("friendships").doc(fid).get();
  if (existingFriendship.exists) {
    throw new Error("Already friends");
  }
  const reqId = friendRequestDocId(fromUid, toUid);
  const ref = db.collection("friendRequests").doc(reqId);
  const cur = await ref.get();
  const now = new Date().toISOString();
  if (cur.exists && cur.data()?.status === "pending") {
    throw new Error("Request already pending");
  }
  await ref.set(
    {
      fromUid,
      toUid,
      status: "pending",
      createdAt: cur.exists ? (cur.data()?.createdAt as string) ?? now : now,
      updatedAt: now,
    },
    { merge: true },
  );
  return { toUid };
}

export async function acceptFriendRequest(viewerUid: string, fromUid: string): Promise<void> {
  const reqId = friendRequestDocId(fromUid, viewerUid);
  const ref = db.collection("friendRequests").doc(reqId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("Request not found");
  }
  const data = snap.data()!;
  if (data.toUid !== viewerUid || data.fromUid !== fromUid) {
    throw new Error("Request not found");
  }
  if (data.status !== "pending") {
    throw new Error("Request not pending");
  }
  const toUid = viewerUid;
  const fid = friendshipId(fromUid, toUid);
  const now = new Date().toISOString();

  const batch = db.batch();
  batch.update(ref, { status: "accepted", updatedAt: now });
  batch.set(db.collection("friendships").doc(fid), {
    members: [fromUid, toUid].sort(),
    createdAt: now,
  });

  const maxFrom = await maxSortRank(fromUid);
  const maxTo = await maxSortRank(toUid);
  const edgeFrom = db.collection("users").doc(fromUid).collection("friendEdges").doc(toUid);
  const edgeTo = db.collection("users").doc(toUid).collection("friendEdges").doc(fromUid);
  batch.set(
    edgeFrom,
    {
      friendshipId: fid,
      counterpartyUid: toUid,
      sortRank: maxFrom + 1,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );
  batch.set(
    edgeTo,
    {
      friendshipId: fid,
      counterpartyUid: fromUid,
      sortRank: maxTo + 1,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  await batch.commit();
}

export async function declineFriendRequest(viewerUid: string, fromUid: string): Promise<void> {
  const reqId = friendRequestDocId(fromUid, viewerUid);
  const ref = db.collection("friendRequests").doc(reqId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Request not found");
  const data = snap.data()!;
  if (data.toUid !== viewerUid || data.fromUid !== fromUid) throw new Error("Request not found");
  await ref.update({ status: "declined", updatedAt: new Date().toISOString() });
}

export async function listIncomingRequests(uid: string) {
  const snap = await db.collection("friendRequests").where("toUid", "==", uid).where("status", "==", "pending").get();
  const out = [];
  for (const d of snap.docs) {
    const fromUid = String(d.data().fromUid ?? "");
    const pub = await getPublicProfile(fromUid);
    out.push({ id: d.id, fromUid, profile: pub });
  }
  return out;
}

export async function listOutgoingRequests(uid: string) {
  const snap = await db.collection("friendRequests").where("fromUid", "==", uid).where("status", "==", "pending").get();
  const out = [];
  for (const d of snap.docs) {
    const toUid = String(d.data().toUid ?? "");
    const pub = await getPublicProfile(toUid);
    out.push({ id: d.id, toUid, profile: pub });
  }
  return out;
}

export async function listFriends(uid: string) {
  const snap = await db.collection("users").doc(uid).collection("friendEdges").orderBy("sortRank", "asc").get();
  const friends = [];
  for (const d of snap.docs) {
    const otherUid = d.id;
    const pub = await getPublicProfile(otherUid);
    if (!pub) continue;
    friends.push({
      counterpartyUid: otherUid,
      sortRank: d.data()?.sortRank ?? 0,
      profile: pub,
      lastAcceptedInviteAt: d.data()?.lastAcceptedInviteAt ? String(d.data()?.lastAcceptedInviteAt) : undefined,
    });
  }
  return friends;
}

export async function reorderFriends(uid: string, orderedCounterpartyUids: string[]): Promise<void> {
  const batch = db.batch();
  const now = new Date().toISOString();
  orderedCounterpartyUids.forEach((otherUid, idx) => {
    const ref = db.collection("users").doc(uid).collection("friendEdges").doc(otherUid);
    batch.set(ref, { sortRank: idx, updatedAt: now }, { merge: true });
  });
  await batch.commit();
}

/** Remove mutual friendship, both friendEdges, and any pending friendRequests between the pair. */
export async function removeFriendship(viewerUid: string, counterpartyUid: string): Promise<void> {
  if (viewerUid === counterpartyUid) {
    throw new Error("Invalid counterparty");
  }
  if (!(await assertFriendship(viewerUid, counterpartyUid))) {
    throw new Error("Not friends with this user");
  }
  const fid = friendshipId(viewerUid, counterpartyUid);
  const reqId1 = friendRequestDocId(viewerUid, counterpartyUid);
  const reqId2 = friendRequestDocId(counterpartyUid, viewerUid);
  const r1 = await db.collection("friendRequests").doc(reqId1).get();
  const r2 = await db.collection("friendRequests").doc(reqId2).get();

  const batch = db.batch();
  batch.delete(db.collection("friendships").doc(fid));
  batch.delete(db.collection("users").doc(viewerUid).collection("friendEdges").doc(counterpartyUid));
  batch.delete(db.collection("users").doc(counterpartyUid).collection("friendEdges").doc(viewerUid));
  if (r1.exists && r1.data()?.status === "pending") batch.delete(r1.ref);
  if (r2.exists && r2.data()?.status === "pending") batch.delete(r2.ref);
  await batch.commit();
}

/** Public profile + hangout prefs for a friend (same data used for AI suggestions). */
export async function getFriendDetail(
  viewerUid: string,
  counterpartyUid: string,
): Promise<{ counterpartyUid: string; profile: UsersPublicDoc; prefs: HangoutPrefsFields } | null> {
  if (!(await assertFriendship(viewerUid, counterpartyUid))) return null;
  const profile = await getPublicProfile(counterpartyUid);
  if (!profile) return null;
  const prefs = await getPrivatePrefs(counterpartyUid);
  return { counterpartyUid, profile, prefs };
}

export async function searchUsernamesByPrefix(prefixRaw: string, limit = 20): Promise<{ username: string; uid: string }[]> {
  const prefix = normalizeUsername(prefixRaw);
  if (prefix.length < 2) return [];
  const end = `${prefix}\uf8ff`;
  const snap = await db
    .collection("usernames")
    .where(FieldPath.documentId(), ">=", prefix)
    .where(FieldPath.documentId(), "<=", end)
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({
    username: d.id,
    uid: String(d.data()?.uid ?? ""),
  }));
}
