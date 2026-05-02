export type MockSeedUser = {
  username: string;
  displayName: string;
  photoURL?: string;
  prefs?: Partial<{
    nickname: string;
    hobbies: string;
    favouriteFoods: string;
    favouriteActivities: string;
    personalityNotes: string;
    budgetLevel: string;
    availabilityNotes: string;
    tags: string[];
    address: string;
  }>;
};

/** Shared list for `seed:mock-users` and `seed:accept-requests`. */
export const MOCK_USERS: MockSeedUser[] = [
  { username: "river_m", displayName: "River M", prefs: { hobbies: "climbing, film" } },
  { username: "case_n", displayName: "Case N", prefs: { favouriteFoods: "ramen, tacos" } },
  { username: "jules_k", displayName: "Jules K", prefs: { favouriteActivities: "board games" } },
  { username: "morgan_p", displayName: "Morgan P", prefs: { budgetLevel: "medium" } },
  { username: "sky_t", displayName: "Sky T", prefs: { availabilityNotes: "weekends" } },
];
