import { z } from "zod";
import { suggestionItemSchema, type SuggestionItem } from "../../schemas/suggestion.js";

const arraySchema = z.array(suggestionItemSchema);

export function parseSuggestionsJson(raw: string): SuggestionItem[] {
  const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
  const parsed: unknown = JSON.parse(checkedJson(cleaned));
  const result = arraySchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("Model returned invalid suggestion shape");
  }
  const arr = result.data;
  if (arr.length >= 3) return arr.slice(0, 3);
  const out = [...arr];
  for (let i = arr.length; i < 3; i += 1) {
    out.push(fallback(i));
  }
  return out;
}

function checkedJson(s: string): string {
  const start = s.indexOf("[");
  const end = s.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON array in model output");
  }
  return s.slice(start, end + 1);
}

function fallback(i: number): SuggestionItem {
  return {
    title: `Idea ${i + 1}`,
    reason: "Fallback suggestion",
    estimatedCost: "$$",
    estimatedDuration: "2 hours",
    nearbyPlaces: [],
  };
}
