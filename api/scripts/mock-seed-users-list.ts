export type MockSeedUser = {
  username: string;
  displayName: string;
  photoURL?: string;
  /** Full prefs so suggestions + “both users need prefs” checks succeed after seeding. */
  prefs: {
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
};

/** Shared list for `seed:mock-users` and `seed:accept-requests`. */
export const MOCK_USERS: MockSeedUser[] = [
  {
    username: "river_m",
    displayName: "River M",
    prefs: {
      nickname: "River",
      hobbies: "climbing, film, indie zines",
      favouriteFoods: "Vietnamese, sourdough bakeries",
      favouriteActivities: "bouldering, matinee screenings",
      personalityNotes: "Prefers mornings; likes low-key hangs.",
      budgetLevel: "medium",
      availabilityNotes: "Sat–Sun; some Wed evenings.",
      tags: ["outdoors", "film"],
      address: "Riverside",
    },
  },
  {
    username: "case_n",
    displayName: "Case N",
    prefs: {
      nickname: "Case",
      hobbies: "running, podcasts, cooking",
      favouriteFoods: "ramen, tacos, bubble tea",
      favouriteActivities: "food crawls, park runs",
      personalityNotes: "Spontaneous but hates long queues.",
      budgetLevel: "low",
      availabilityNotes: "Weekday lunches + Sunday afternoons.",
      tags: ["foodie", "fitness"],
      address: "Eastside",
    },
  },
  {
    username: "jules_k",
    displayName: "Jules K",
    prefs: {
      nickname: "Jules",
      hobbies: "board games, trivia, piano",
      favouriteFoods: "dim sum, pizza by the slice",
      favouriteActivities: "game nights, small gigs",
      personalityNotes: "Needs a plan 24h ahead; introvert-friendly.",
      budgetLevel: "medium",
      availabilityNotes: "Fri nights + most Saturdays.",
      tags: ["games", "music"],
      address: "Midtown",
    },
  },
  {
    username: "morgan_p",
    displayName: "Morgan P",
    prefs: {
      nickname: "Morgan",
      hobbies: "pottery, cycling, sci-fi",
      favouriteFoods: "Mediterranean, craft beer",
      favouriteActivities: "studio classes, long bike loops",
      personalityNotes: "Loves trying one new spot per month.",
      budgetLevel: "medium",
      availabilityNotes: "Weekends; travel one weekend/mo.",
      tags: ["art", "cycling"],
      address: "Warehouse district",
    },
  },
  {
    username: "sky_t",
    displayName: "Sky T",
    prefs: {
      nickname: "Sky",
      hobbies: "yoga, photography, volunteering",
      favouriteFoods: "vegetarian bowls, specialty coffee",
      favouriteActivities: "sunrise hikes, farmers markets",
      personalityNotes: "Quiet spaces; prefers daylight plans.",
      budgetLevel: "low",
      availabilityNotes: "Weekends only; off-grid some Sundays.",
      tags: ["wellness", "photo"],
      address: "Hill district",
    },
  },
];
