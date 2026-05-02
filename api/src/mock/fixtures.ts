import type { HangoutPrefsFields } from "../schemas/hangoutPrefs.js";
import type { UsersPublicDoc } from "../schemas/usersPublic.js";
import { MOCK_UIDS } from "./uids.js";

const T0 = "2025-01-15T12:00:00.000Z";

/** Public + prefs for seeded friends (same for every mock session). */
export const MOCK_FRIEND_FIXTURES: Record<string, { public: UsersPublicDoc; prefs: HangoutPrefsFields }> = {
  [MOCK_UIDS.sam]: {
    public: {
      uid: MOCK_UIDS.sam,
      username: "sam",
      usernameLower: "sam",
      displayName: "Sam Rivera",
      photoURL: "",
      updatedAt: T0,
    },
    prefs: {
      nickname: "Sam",
      hobbies: "photography, hiking",
      favouriteFoods: "tacos, cold brew",
      favouriteActivities: "gallery openings, weekend hikes",
      personalityNotes: "Early riser, prefers small groups.",
      budgetLevel: "medium",
      availabilityNotes: "Weekends and Thu evenings.",
      tags: ["outdoors", "coffee"],
      address: "Northside",
    },
  },
  [MOCK_UIDS.jordan]: {
    public: {
      uid: MOCK_UIDS.jordan,
      username: "jordan",
      usernameLower: "jordan",
      displayName: "Jordan Lee",
      photoURL: "",
      updatedAt: T0,
    },
    prefs: {
      nickname: "J",
      hobbies: "board games, cooking",
      favouriteFoods: "sushi, dumplings",
      favouriteActivities: "trivia night, trying new restaurants",
      personalityNotes: "Night owl, loves structured plans.",
      budgetLevel: "low",
      availabilityNotes: "Fri–Sun best.",
      tags: ["foodie", "games"],
      address: "Downtown",
    },
  },
};

export function defaultViewerPublic(uid: string): UsersPublicDoc {
  return {
    uid,
    username: "alex_demo",
    usernameLower: "alex_demo",
    displayName: "Alex (demo)",
    photoURL: "",
    updatedAt: T0,
  };
}

export function defaultViewerPrefs(): HangoutPrefsFields {
  return {
    nickname: "Al",
    hobbies: "film, bouldering",
    favouriteFoods: "ramen, espresso",
    favouriteActivities: "cinema, climbing gym",
    personalityNotes: "Flexible on timing; prefers walkable spots.",
    budgetLevel: "medium",
    availabilityNotes: "Weeknights after 6.",
    tags: ["climbing", "movies"],
    address: "West end",
  };
}
