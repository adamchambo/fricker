import { Router } from "express";
import { hangoutPrefsFieldsSchema } from "../schemas/hangoutPrefs.js";
import { usersPublicWriteSchema } from "../schemas/usersPublic.js";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { getUserId } from "../middleware/get-user-id.js";
import * as mock from "../mock/handlers.js";
import { normalizeUsername } from "../services/social/ids.js";
import { getPrivatePrefs, getPublicProfile } from "../services/social/profiles.js";
import { db } from "../services/firebase-admin.js";

export const profileRouter = Router();

profileRouter.use(requireAuth);

profileRouter.get("/profile/me", async (req, res) => {
  const uid = getUserId(req);
  if (env.useMockData) {
    res.json(mock.mockProfileMe(uid));
    return;
  }
  const pub = await getPublicProfile(uid);
  const prefs = await getPrivatePrefs(uid);
  res.json({ uid, public: pub, prefs });
});

profileRouter.post("/profile/public", async (req, res) => {
  const uid = getUserId(req);
  const parsed = usersPublicWriteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  if (env.useMockData) {
    try {
      const pub = mock.mockPostPublic(uid, parsed.data);
      res.status(200).json({ profile: pub });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "USERNAME_TAKEN") {
        res.status(409).json({ error: "Username already taken" });
        return;
      }
      throw e;
    }
    return;
  }
  const usernameLower = normalizeUsername(parsed.data.username);
  const now = new Date().toISOString();

  try {
    await db.runTransaction(async (tx) => {
      const publicRef = db.collection("usersPublic").doc(uid);
      const privRef = db.collection("usersPrivate").doc(uid);
      const usernameRef = db.collection("usernames").doc(usernameLower);

      const [existingPublic, usernameSnap, privSnap] = await Promise.all([
        tx.get(publicRef),
        tx.get(usernameRef),
        tx.get(privRef),
      ]);

      const prevLower = existingPublic.exists ? String(existingPublic.data()?.usernameLower ?? "") : "";

      if (usernameSnap.exists && String(usernameSnap.data()?.uid ?? "") !== uid) {
        throw new Error("USERNAME_TAKEN");
      }

      if (prevLower && prevLower !== usernameLower) {
        tx.delete(db.collection("usernames").doc(prevLower));
      }

      tx.set(usernameRef, { uid, createdAt: usernameSnap.exists ? usernameSnap.data()?.createdAt ?? now : now });
      tx.set(
        publicRef,
        {
          uid,
          username: parsed.data.username.trim(),
          usernameLower,
          displayName: parsed.data.displayName.trim(),
          photoURL: parsed.data.photoURL ?? "",
          updatedAt: now,
        },
        { merge: true },
      );

      if (!privSnap.exists) {
        tx.set(privRef, {
          nickname: "",
          hobbies: "",
          favouriteFoods: "",
          favouriteActivities: "",
          personalityNotes: "",
          budgetLevel: "",
          availabilityNotes: "",
          tags: [],
          address: "",
          updatedAt: now,
        });
      }
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "USERNAME_TAKEN") {
      res.status(409).json({ error: "Username already taken" });
      return;
    }
    throw e;
  }

  const pub = await getPublicProfile(uid);
  res.status(200).json({ profile: pub });
});

profileRouter.patch("/profile/prefs", async (req, res) => {
  const uid = getUserId(req);
  const parsed = hangoutPrefsFieldsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  if (env.useMockData) {
    mock.mockPatchPrefs(uid, parsed.data);
    res.json({ ok: true });
    return;
  }
  const now = new Date().toISOString();
  await db.collection("usersPrivate").doc(uid).set({ ...parsed.data, updatedAt: now }, { merge: true });
  res.json({ ok: true });
});
