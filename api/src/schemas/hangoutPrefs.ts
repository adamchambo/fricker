import { z } from "zod";

/** Private preference blob used for AI suggestions (not fully public). */
export const hangoutPrefsFieldsSchema = z.object({
  nickname: z.string().optional().default(""),
  hobbies: z.string().optional().default(""),
  favouriteFoods: z.string().optional().default(""),
  favouriteActivities: z.string().optional().default(""),
  personalityNotes: z.string().optional().default(""),
  budgetLevel: z.string().optional().default(""),
  availabilityNotes: z.string().optional().default(""),
  tags: z.array(z.string()).optional().default([]),
  address: z.string().optional().default(""),
});

export type HangoutPrefsFields = z.infer<typeof hangoutPrefsFieldsSchema>;
