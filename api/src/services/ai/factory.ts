import { env } from "../../config/env.js";
import { AnthropicProvider } from "./anthropic.provider.js";
import { LMStudioProvider } from "./lmstudio.provider.js";
import { MockProvider } from "./mock.provider.js";
import { OllamaProvider } from "./ollama.provider.js";
import { OpenAIProvider } from "./openai.provider.js";
import type { AiProvider } from "./provider.interface.js";

export function createAiProvider(): AiProvider {
  switch (env.aiProvider) {
    case "openai":
      if (!env.openaiApiKey) {
        console.warn("[fricker api] OPENAI_API_KEY missing — using mock suggestions.");
        return new MockProvider();
      }
      return new OpenAIProvider(env.openaiApiKey);
    case "anthropic":
      if (!env.anthropicApiKey) {
        console.warn("[fricker api] ANTHROPIC_API_KEY missing — using mock suggestions.");
        return new MockProvider();
      }
      return new AnthropicProvider(env.anthropicApiKey);
    case "lmstudio":
      return new LMStudioProvider(env.lmstudioBaseUrl);
    case "ollama":
      return new OllamaProvider(env.ollamaBaseUrl);
    case "mock":
    default:
      return new MockProvider();
  }
}
