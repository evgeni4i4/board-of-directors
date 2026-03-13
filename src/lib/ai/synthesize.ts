import { getAnthropicClient, MODELS } from "@/lib/ai/client";
import {
  SYNTHESIS_SYSTEM_PROMPT,
  SYNTHESIS_USER_TEMPLATE,
} from "@/lib/ai/prompts/synthesis-prompt";

export async function generateSynthesis(
  question: string,
  responses: { advisorName: string; content: string }[],
  model: (typeof MODELS)[keyof typeof MODELS] = MODELS.fast
): Promise<string> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    system: SYNTHESIS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: SYNTHESIS_USER_TEMPLATE(question, responses),
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from synthesis model");
  }

  return textBlock.text.trim();
}
