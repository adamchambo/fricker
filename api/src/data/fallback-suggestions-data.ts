/** Bundled offline suggestions when the LLM provider fails (validated in `fallback-suggestions.ts`). */
export const FALLBACK_SUGGESTIONS_RAW = [
  {
    title: "Coffee and a walk",
    reason: "Easy to schedule, low pressure, and you can extend or keep it short.",
    estimatedCost: "$",
    estimatedDuration: "1–2 hours",
    nearbyPlaces: ["Local cafe", "Park loop"],
  },
  {
    title: "Casual dinner out",
    reason: "Good for catching up with room to talk without a rigid activity.",
    estimatedCost: "$$",
    estimatedDuration: "2 hours",
    nearbyPlaces: ["Neighborhood spot", "Dessert nearby"],
  },
  {
    title: "Museum or gallery visit",
    reason: "Built-in conversation starters and a change of scenery.",
    estimatedCost: "$–$$",
    estimatedDuration: "2–3 hours",
    nearbyPlaces: ["Main exhibit", "Cafe in the building"],
  },
  {
    title: "Farmers market + picnic",
    reason: "Movement, food choices, and easy vibe if weather cooperates.",
    estimatedCost: "$–$$",
    estimatedDuration: "2 hours",
    nearbyPlaces: ["Market stalls", "Nearby green space"],
  },
  {
    title: "Trivia or board-game night",
    reason: "Structured fun when you want something lively and repeatable.",
    estimatedCost: "$–$$$",
    estimatedDuration: "2–4 hours",
    nearbyPlaces: ["Pub trivia", "Game cafe"],
  },
  {
    title: "Hike or easy trail",
    reason: "Gets you moving together; pick a trail that matches both energy levels.",
    estimatedCost: "$",
    estimatedDuration: "2–4 hours",
    nearbyPlaces: ["Trailhead", "Post-hike snack stop"],
  },
] as const;
