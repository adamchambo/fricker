export type SuggestionItem = {
  title: string;
  reason: string;
  estimatedCost: string;
  estimatedDuration: string;
  nearbyPlaces?: string[];
};

export function suggestionRowKey(s: SuggestionItem): string {
  return `${s.title}::${s.estimatedDuration}`;
}
