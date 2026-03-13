import { getAnthropicClient, MODELS } from "@/lib/ai/client";
import {
  buildRecommendPrompt,
  RECOMMEND_USER_TEMPLATE,
} from "@/lib/ai/prompts/recommend-prompt";

export interface Recommendation {
  slug: string;
  reason: string;
}

export interface RecommendResult {
  topics: string[];
  recommendations: Recommendation[];
}

export async function recommendAdvisors(
  question: string,
  advisorRoster: string
): Promise<RecommendResult> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: MODELS.haiku,
    max_tokens: 512,
    system: buildRecommendPrompt(advisorRoster),
    messages: [
      {
        role: "user",
        content: RECOMMEND_USER_TEMPLATE(question),
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from recommendation model");
  }

  const rawText = textBlock.text.trim();

  // Try to parse JSON directly; if wrapped in code fences, strip them
  let jsonString = rawText;
  const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonString = fenceMatch[1].trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error(
      `Failed to parse recommendation response as JSON: ${rawText.slice(0, 200)}`
    );
  }

  // Validate structure
  const result = parsed as Record<string, unknown>;
  if (
    !Array.isArray(result.topics) ||
    !Array.isArray(result.recommendations) ||
    result.recommendations.length === 0
  ) {
    throw new Error(
      `Invalid recommendation response structure: ${JSON.stringify(result).slice(0, 200)}`
    );
  }

  // Ensure we have exactly 3 recommendations (or at least up to 3)
  const recommendations = (
    result.recommendations as Array<{ slug: string; reason: string }>
  ).slice(0, 3);

  return {
    topics: result.topics as string[],
    recommendations: recommendations.map((r) => ({
      slug: String(r.slug),
      reason: String(r.reason),
    })),
  };
}
