import type { SuggestionItem } from "./suggestion";

export type HangoutInviteRow = {
  id: string;
  fromUid: string;
  toUid: string;
  activity: SuggestionItem;
  status: "pending" | "accepted" | "declined" | "cancelled";
  createdAt: string;
  updatedAt: string;
  respondedAt?: string;
  message?: string;
};
