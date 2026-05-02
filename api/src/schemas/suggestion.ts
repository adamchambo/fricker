import { z } from "zod";

export const suggestionItemSchema = z.object({
  title: z.string(),
  reason: z.string(),
  estimatedCost: z.string(),
  estimatedDuration: z.string(),
  nearbyPlaces: z.array(z.string()).optional().default([]),
});

export type SuggestionItem = z.infer<typeof suggestionItemSchema>;
