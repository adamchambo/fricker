/**
 * @deprecated Legacy shape for private “contact card” friends. The app uses real users
 * and GET /api/friends (see `types/social.ts`). `friendId` in history/saved is a counterparty UID.
 */
export type Friend = {
  id: string;
  name: string;
  nickname: string;
  photo: string;
  phone: string;
  address: string;
  hobbies: string;
  favouriteFoods: string;
  favouriteActivities: string;
  personalityNotes: string;
  budgetLevel: string;
  availabilityNotes: string;
  tags: string[];
  birthday: string | null | undefined;
  createdAt: string;
  updatedAt: string;
};

export const emptyFriend = (): Omit<Friend, "id" | "createdAt" | "updatedAt"> => ({
  name: "",
  nickname: "",
  photo: "",
  phone: "",
  address: "",
  hobbies: "",
  favouriteFoods: "",
  favouriteActivities: "",
  personalityNotes: "",
  budgetLevel: "",
  availabilityNotes: "",
  tags: [],
  birthday: null,
});
