import { z } from "zod";
import { FALLBACK_SUGGESTIONS_RAW } from "../../data/fallback-suggestions-data.js";
import { suggestionItemSchema, type SuggestionItem } from "../../schemas/suggestion.js";

const listSchema = z.array(suggestionItemSchema);

let cached: SuggestionItem[] | null = null;

export function loadFallbackSuggestions(): SuggestionItem[] {
  if (cached) return cached;
  cached = listSchema.parse(FALLBACK_SUGGESTIONS_RAW);
  return cached;
}
