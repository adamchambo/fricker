import { z } from "zod";
import { suggestionItemSchema } from "./suggestion.js";

export const savedSuggestionCreateSchema = suggestionItemSchema.extend({
  friendId: z.string().min(1),
  inviteText: z.string().optional().default(""),
});

export type SavedSuggestionCreate = z.infer<typeof savedSuggestionCreateSchema>;
