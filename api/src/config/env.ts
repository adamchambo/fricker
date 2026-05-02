import "dotenv/config";

function parseOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) return ["http://localhost:3000"];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function truthyEnv(key: string): boolean {
  const v = process.env[key]?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV ?? "development",
  allowedOrigins: parseOrigins(process.env.ALLOWED_ORIGINS),
  /** In-memory social/profile/history/saved/invites per authenticated user — no Firestore for those routes. */
  useMockData: truthyEnv("USE_MOCK_DATA"),
  aiProvider: (process.env.AI_PROVIDER ?? "mock").toLowerCase(),
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  lmstudioBaseUrl: process.env.LMSTUDIO_BASE_URL ?? "http://127.0.0.1:1234/v1",
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/v1",
};
