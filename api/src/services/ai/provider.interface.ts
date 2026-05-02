import type { HangoutPrefsFields } from "../../schemas/hangoutPrefs.js";
import type { SuggestionItem } from "../../schemas/suggestion.js";

export type PersonHangoutContext = HangoutPrefsFields & {
  displayName: string;
  username: string;
};

export interface AiProvider {
  generateSuggestions(ctx: {
    viewer: PersonHangoutContext;
    counterparty: PersonHangoutContext;
  }): Promise<SuggestionItem[]>;
}
