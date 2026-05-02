export type HangoutHistoryItem = {
  id: string;
  friendId: string;
  friendName: string;
  activity: string;
  date: string;
  notes: string;
  rating: number | null | undefined;
  createdAt: string;
};
