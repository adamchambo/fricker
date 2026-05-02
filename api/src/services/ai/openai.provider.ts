import OpenAI from "openai";
import type { AiProvider, PersonHangoutContext } from "./provider.interface.js";
import type { SuggestionItem } from "../../schemas/suggestion.js";
import { dualHangoutPrompt } from "./dual-prompt.js";
import { parseSuggestionsJson } from "./parse-suggestions.js";

export class OpenAIProvider implements AiProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateSuggestions(ctx: {
    viewer: PersonHangoutContext;
    counterparty: PersonHangoutContext;
  }): Promise<SuggestionItem[]> {
    const prompt = `${dualHangoutPrompt(ctx.viewer, ctx.counterparty)}\n\nReturn ONLY a JSON array of exactly 3 objects with keys: title, reason, estimatedCost, estimatedDuration, nearbyPlaces (array of strings). No markdown.`;
    const res = await this.client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You suggest hangout ideas for two friends. Output only valid JSON array with exactly 3 items.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });
    const text = res.choices[0]?.message?.content ?? "";
    return parseSuggestionsJson(text);
  }
}
