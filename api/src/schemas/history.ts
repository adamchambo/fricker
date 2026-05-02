import { z } from "zod";

export const hangoutHistoryCreateSchema = z.object({
  friendId: z.string().min(1),
  friendName: z.string().min(1),
  activity: z.string().min(1),
  date: z.string().min(1),
  notes: z.string().optional().default(""),
  rating: z.number().min(1).max(5).nullable().optional(),
});

export type HangoutHistoryCreate = z.infer<typeof hangoutHistoryCreateSchema>;
