import type { HangoutPrefsFields } from "../../schemas/hangoutPrefs.js";
import type { UsersPublicDoc } from "../../schemas/usersPublic.js";
import { db } from "../firebase-admin.js";

export async function getPublicProfile(uid: string): Promise<UsersPublicDoc | null> {
  const doc = await db.collection("usersPublic").doc(uid).get();
  if (!doc.exists) return null;
  const data = doc.data() ?? {};
  return {
    uid,
    username: String(data.username ?? ""),
    usernameLower: String(data.usernameLower ?? ""),
    displayName: String(data.displayName ?? ""),
    photoURL: String(data.photoURL ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
}

export async function getPrivatePrefs(uid: string): Promise<HangoutPrefsFields> {
  const doc = await db.collection("usersPrivate").doc(uid).get();
  if (!doc.exists) {
    return {
      nickname: "",
      hobbies: "",
      favouriteFoods: "",
      favouriteActivities: "",
      personalityNotes: "",
      budgetLevel: "",
      availabilityNotes: "",
      tags: [],
      address: "",
    };
  }
  const d = doc.data() ?? {};
  return {
    nickname: String(d.nickname ?? ""),
    hobbies: String(d.hobbies ?? ""),
    favouriteFoods: String(d.favouriteFoods ?? ""),
    favouriteActivities: String(d.favouriteActivities ?? ""),
    personalityNotes: String(d.personalityNotes ?? ""),
    budgetLevel: String(d.budgetLevel ?? ""),
    availabilityNotes: String(d.availabilityNotes ?? ""),
    tags: Array.isArray(d.tags) ? d.tags.map(String) : [],
    address: String(d.address ?? ""),
  };
}
