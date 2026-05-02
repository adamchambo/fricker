import OpenAI from "openai";
import type { AiProvider, PersonHangoutContext } from "./provider.interface.js";
import type { SuggestionItem } from "../../schemas/suggestion.js";
import { dualHangoutPrompt } from "./dual-prompt.js";
import { parseSuggestionsJson } from "./parse-suggestions.js";

/** OpenAI-compatible Ollama endpoint, e.g. http://127.0.0.1:11434/v1 */
export class OllamaProvider implements AiProvider {
  private client: OpenAI;

  constructor(baseUrl: string) {
    this.client = new OpenAI({ baseURL: baseUrl, apiKey: "ollama" });
  }

  async generateSuggestions(ctx: {
    viewer: PersonHangoutContext;
    counterparty: PersonHangoutContext;
  }): Promise<SuggestionItem[]> {
    const prompt = `${dualHangoutPrompt(ctx.viewer, ctx.counterparty)}\n\nReturn ONLY JSON array of 3 objects with keys title, reason, estimatedCost, estimatedDuration, nearbyPlaces (string array).`;
    const res = await this.client.chat.completions.create({
      model: process.env.OLLAMA_MODEL ?? "llama3.2",
      messages: [
        {
          role: "system",
          content:
            "You output only valid JSON arrays for hangout suggestions for TWO friends. No markdown fences.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });
    const text = res.choices[0]?.message?.content ?? "";
    return parseSuggestionsJson(text);
  }
}
