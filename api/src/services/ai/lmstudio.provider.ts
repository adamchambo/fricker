import OpenAI from "openai";
import type { AiProvider, PersonHangoutContext } from "./provider.interface.js";
import type { SuggestionItem } from "../../schemas/suggestion.js";
import { dualHangoutPrompt } from "./dual-prompt.js";
import { parseSuggestionsJson } from "./parse-suggestions.js";

export class LMStudioProvider implements AiProvider {
  private client: OpenAI;

  constructor(baseUrl: string) {
    this.client = new OpenAI({ baseURL: baseUrl, apiKey: "lm-studio" });
  }

  async generateSuggestions(ctx: {
    viewer: PersonHangoutContext;
    counterparty: PersonHangoutContext;
  }): Promise<SuggestionItem[]> {
    const content = await this.runModel(ctx.viewer, ctx.counterparty);
    return parseSuggestionsJson(content);
  }

  private async runModel(viewer: PersonHangoutContext, counterparty: PersonHangoutContext): Promise<string> {
    const prompt = dualHangoutPrompt(viewer, counterparty);
    const res = await this.client.chat.completions.create({
      model: "local-model",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });
    const text = res.choices[0]?.message?.content ?? "";
    return text;
  }
}

const SYSTEM = `You plan real-life hangouts between two friends. Return ONLY valid JSON: an array of exactly 3 objects with keys: title, reason, estimatedCost, estimatedDuration, nearbyPlaces (string array). No markdown.`;
