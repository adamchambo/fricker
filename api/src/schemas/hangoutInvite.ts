import { z } from "zod";
import { suggestionItemSchema } from "./suggestion.js";

export const inviteActivitySchema = suggestionItemSchema;

export const hangoutInviteCreateSchema = z.object({
  counterpartyUid: z.string().min(1),
  activity: inviteActivitySchema,
  message: z.string().max(2000).optional(),
});

export type HangoutInviteCreate = z.infer<typeof hangoutInviteCreateSchema>;

export const hangoutInviteStatusSchema = z.enum(["pending", "accepted", "declined", "cancelled"]);

export const hangoutInviteDocSchema = z.object({
  id: z.string(),
  fromUid: z.string(),
  toUid: z.string(),
  activity: inviteActivitySchema,
  status: hangoutInviteStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  respondedAt: z.string().optional(),
  message: z.string().max(2000).optional(),
});

export type HangoutInviteDoc = z.infer<typeof hangoutInviteDocSchema>;
