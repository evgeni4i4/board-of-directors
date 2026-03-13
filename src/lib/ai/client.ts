import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }
  return client;
}

export const MODELS = {
  fast: "claude-sonnet-4-5-20250929", // Free tier — fast classification + responses
  quality: "claude-opus-4-6", // Pro tier — best quality responses
  haiku: "claude-haiku-4-5-20251001", // Recommendation engine — cheapest
} as const;
