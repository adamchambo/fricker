import Anthropic from "@anthropic-ai/sdk";
import type { AiProvider, PersonHangoutContext } from "./provider.interface.js";
import type { SuggestionItem } from "../../schemas/suggestion.js";
import { dualHangoutPrompt } from "./dual-prompt.js";
import { parseSuggestionsJson } from "./parse-suggestions.js";

export class AnthropicProvider implements AiProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateSuggestions(ctx: {
    viewer: PersonHangoutContext;
    counterparty: PersonHangoutContext;
  }): Promise<SuggestionItem[]> {
    const prompt = `${dualHangoutPrompt(ctx.viewer, ctx.counterparty)}\n\nReturn ONLY a JSON array of exactly 3 objects with keys: title, reason, estimatedCost, estimatedDuration, nearbyPlaces (array of strings). No other text.`;
    const msg = await this.client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-3-haiku-20240307",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const block = msg.content[0];
    const text = block?.type === "text" ? block.text : "";
    return parseSuggestionsJson(text);
  }
}
