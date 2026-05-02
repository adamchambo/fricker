import type { AiProvider, PersonHangoutContext } from "./provider.interface.js";
import type { SuggestionItem } from "../../schemas/suggestion.js";

function firstToken(text: string): string {
  const t = text.trim();
  if (!t) return "";
  const part = t.split(/[,;]/)[0]?.trim() ?? t;
  return part.length > 48 ? `${part.slice(0, 47)}…` : part;
}

function budgetHint(level: string): string {
  const l = level.trim().toLowerCase();
  if (l.includes("low")) return "$";
  if (l.includes("high")) return "$$$";
  if (l.includes("medium")) return "$$";
  return "$–$$";
}

/** Deterministic mock suggestions — no API keys; uses friend prefs when present. */
export class MockProvider implements AiProvider {
  async generateSuggestions(ctx: {
    viewer: PersonHangoutContext;
    counterparty: PersonHangoutContext;
  }): Promise<SuggestionItem[]> {
    const friendLabel = ctx.counterparty.nickname || ctx.counterparty.displayName;
    const you = ctx.viewer.displayName;
    const food = firstToken(ctx.counterparty.favouriteFoods) || firstToken(ctx.viewer.favouriteFoods);
    const activity =
      firstToken(ctx.counterparty.favouriteActivities) ||
      firstToken(ctx.viewer.favouriteActivities) ||
      firstToken(ctx.counterparty.hobbies) ||
      firstToken(ctx.viewer.hobbies);
    const budget = budgetHint(ctx.counterparty.budgetLevel || ctx.viewer.budgetLevel);
    const area =
      firstToken(ctx.counterparty.address) ||
      firstToken(ctx.viewer.address) ||
      "your usual spots";
    const tag = ctx.counterparty.tags[0] || ctx.viewer.tags[0];

    const basePlaces = [area, tag ? `${tag} picks nearby` : "Somewhere easy to reach"].filter(Boolean);

    return [
      {
        title: food
          ? `${food} hangout (${friendLabel} × ${you})`
          : `Coffee catch-up (${friendLabel} × ${you})`,
        reason: food
          ? `Mock suggestion — centered on food prefs you both saved. (Set AI_PROVIDER + a key for real LLM ideas.)`
          : "Low-key and easy to schedule — mock data until an AI provider is configured.",
        estimatedCost: budget,
        estimatedDuration: "1–2 hours",
        nearbyPlaces: food ? [`${area}`, "Casual eats nearby"] : basePlaces,
      },
      {
        title: activity ? `${activity} together` : "Walk + casual dinner",
        reason: activity
          ? `Mock suggestion — pulled from hobbies / favourite activities on file.`
          : "Balances movement and food; generic mock pairing.",
        estimatedCost: budget === "$" ? "$–$$" : "$$",
        estimatedDuration: "2–3 hours",
        nearbyPlaces: [`${area}`, "Park or trail", "Casual dinner nearby"],
      },
      {
        title: "Trivia or games night",
        reason:
          "Structured social time — good when you want something repeatable and fun. (Still mock data.)",
        estimatedCost: "$–$$$",
        estimatedDuration: "2–4 hours",
        nearbyPlaces: ["Pub trivia", "Board game cafe"],
      },
    ];
  }
}
