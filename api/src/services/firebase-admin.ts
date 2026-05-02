import type { ServiceAccount } from "firebase-admin/app";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

function initAdmin() {
  if (getApps().length > 0) return;

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath?.trim()) {
    const json = JSON.parse(readFileSync(credPath, "utf8")) as ServiceAccount;
    initializeApp({ credential: cert(json) });
    return;
  }

  initializeApp({ credential: applicationDefault() });
}

initAdmin();

export const adminAuth = getAuth();
export const db = getFirestore();
