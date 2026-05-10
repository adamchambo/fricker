import type { SuggestionItem } from "./suggestion";

/** Public fricker profile (API: usersPublic). */
export type PublicProfile = {
  uid: string;
  username: string;
  usernameLower: string;
  displayName: string;
  photoURL: string;
  updatedAt: string;
};

/** Private hangout prefs (API: usersPrivate) — shared with friends for planning. */
export type HangoutPrefs = {
  nickname: string;
  hobbies: string;
  favouriteFoods: string;
  favouriteActivities: string;
  personalityNotes: string;
  budgetLevel: string;
  availabilityNotes: string;
  tags: string[];
  address: string;
};

/** One row from GET /api/friends (social graph). */
export type SocialFriendEdge = {
  counterpartyUid: string;
  sortRank: number;
  profile: PublicProfile;
  lastAcceptedInviteAt?: string;
};

/** GET /api/friends/:counterpartyUid */
export type FriendDetailResponse = {
  counterpartyUid: string;
  profile: PublicProfile;
  prefs: HangoutPrefs;
};

/** POST /api/suggestions/:uid/generate */
export type SuggestionsGenerateResponse = {
  counterpartyUid: string;
  suggestions: SuggestionItem[];
  source?: "llm" | "fallback";
};
