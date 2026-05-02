import type { SuggestionItem } from "./suggestion";

export type SavedSuggestion = SuggestionItem & {
  id: string;
  friendId: string;
  inviteText: string;
  createdAt: string;
};
