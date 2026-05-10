/**
 * Creates Firebase Auth users + Firestore profile rows so they appear in user search.
 *
 * From api/:  npm run seed:mock-users
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS in .env (same as the API).
 * Optional: MOCK_SEED_PASSWORD (default MockPass123!) — use only for dev accounts.
 *
 * Re-run anytime to refresh `usersPublic` / `usersPrivate` (e.g. after expanding seed prefs).
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import type { ServiceAccount } from "firebase-admin/app";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { MOCK_USERS } from "./mock-seed-users-list.js";

function initAdmin() {
  if (getApps().length > 0) return;
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (!credPath) {
    throw new Error("Set GOOGLE_APPLICATION_CREDENTIALS in api/.env");
  }
  const json = JSON.parse(readFileSync(credPath, "utf8")) as ServiceAccount;
  initializeApp({ credential: cert(json) });
}

function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

const defaultPrefs = {
  nickname: "",
  hobbies: "",
  favouriteFoods: "",
  favouriteActivities: "",
  personalityNotes: "",
  budgetLevel: "",
  availabilityNotes: "",
  tags: [] as string[],
  address: "",
};

async function main() {
  initAdmin();
  const auth = getAuth();
  const db = getFirestore();
  const password = process.env.MOCK_SEED_PASSWORD?.trim() || "MockPass123!";
  const now = new Date().toISOString();

  for (const u of MOCK_USERS) {
    const usernameLower = normalizeUsername(u.username);
    if (usernameLower.length < 3) {
      console.warn(`Skip invalid username: ${u.username}`);
      continue;
    }
    const email = `${usernameLower}@seed.fricker.test`;

    let uid: string;
    try {
      const existing = await auth.getUserByEmail(email);
      uid = existing.uid;
      console.log(`Auth exists: ${email} → ${uid}`);
    } catch {
      const created = await auth.createUser({
        email,
        password,
        displayName: u.displayName,
        emailVerified: true,
      });
      uid = created.uid;
      console.log(`Created auth: ${email} → ${uid}`);
    }

    const photoURL = u.photoURL?.trim() ?? "";

    await db.runTransaction(async (tx) => {
      const usernameRef = db.collection("usernames").doc(usernameLower);
      const usernameSnap = await tx.get(usernameRef);
      const createdAt = usernameSnap.exists ? String(usernameSnap.data()?.createdAt ?? now) : now;

      tx.set(usernameRef, { uid, createdAt });

      tx.set(
        db.collection("usersPublic").doc(uid),
        {
          uid,
          username: u.username.trim(),
          usernameLower,
          displayName: u.displayName.trim(),
          photoURL,
          updatedAt: now,
        },
        { merge: true },
      );

      const prefs = { ...defaultPrefs, ...u.prefs, tags: u.prefs?.tags ?? defaultPrefs.tags };
      tx.set(
        db.collection("usersPrivate").doc(uid),
        {
          ...prefs,
          updatedAt: now,
        },
        { merge: true },
      );
    });

    console.log(`Firestore ok: @${usernameLower} (${uid})`);
  }

  console.log("\nDone. Sign in with any seed email + MOCK_SEED_PASSWORD (default MockPass123!).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
