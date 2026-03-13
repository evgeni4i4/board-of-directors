import { getAuth } from "@/lib/auth";
import { getAnthropicClient, MODELS } from "@/lib/ai/client";
import { ADVISOR_SYSTEM_PROMPTS } from "@/lib/ai/prompts/system-prompts";
import { generateSynthesis } from "@/lib/ai/synthesize";
import {
  getQuery,
  getAdvisorsBySlugs,
  updateQueryStatus,
  createResponse,
} from "@/lib/supabase/queries";
import { getUserPlan } from "@/lib/usage/tracker";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(req: Request) {
  const { userId } = await getAuth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const queryId = url.searchParams.get("queryId");
  if (!queryId) {
    return new Response("Missing queryId", { status: 400 });
  }

  const query = await getQuery(queryId);
  if (!query || query.user_id !== userId) {
    return new Response("Query not found", { status: 404 });
  }

  if (query.status === "complete") {
    return new Response("Query already complete", { status: 400 });
  }

  const advisors = await getAdvisorsBySlugs(query.advisor_slugs as string[]);
  const plan = await getUserPlan(userId);
  const model = plan === "pro" ? MODELS.quality : MODELS.fast;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: Record<string, unknown>) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        await updateQueryStatus(queryId, "generating");

        const allResponses: { advisorName: string; content: string }[] = [];

        // Generate each advisor response sequentially
        for (const advisor of advisors) {
          const systemPrompt = ADVISOR_SYSTEM_PROMPTS[advisor.slug];
          if (!systemPrompt) continue;

          send("advisor_start", {
            advisorSlug: advisor.slug,
            advisorName: advisor.name,
          });

          try {
            const startTime = Date.now();
            let fullContent = "";

            const client = getAnthropicClient();
            const stream = await client.messages.stream({
              model,
              max_tokens: 1024,
              system: systemPrompt,
              messages: [{ role: "user", content: query.question }],
            });

            for await (const event of stream) {
              if (
                event.type === "content_block_delta" &&
                event.delta.type === "text_delta"
              ) {
                fullContent += event.delta.text;
                send("advisor_chunk", {
                  advisorSlug: advisor.slug,
                  content: event.delta.text,
                });
              }
            }

            const generationTimeMs = Date.now() - startTime;
            const finalMessage = await stream.finalMessage();

            // Extract a compelling quote (first sentence or two)
            const sentences = fullContent.split(/(?<=[.!?])\s+/);
            const quote =
              sentences.length > 1
                ? sentences.slice(0, 2).join(" ")
                : sentences[0] || "";

            await createResponse(
              queryId,
              advisor.slug,
              fullContent,
              quote.slice(0, 200),
              generationTimeMs,
              {
                input_tokens: finalMessage.usage.input_tokens,
                output_tokens: finalMessage.usage.output_tokens,
              }
            );

            send("advisor_complete", {
              advisorSlug: advisor.slug,
              content: fullContent,
              quote: quote.slice(0, 200),
            });

            allResponses.push({
              advisorName: advisor.name,
              content: fullContent,
            });
          } catch (advisorError) {
            console.error(`Error generating response for ${advisor.slug}:`, advisorError);
            send("advisor_error", {
              advisorSlug: advisor.slug,
              error: "Failed to generate response",
            });
          }
        }

        // Generate synthesis
        await updateQueryStatus(queryId, "synthesizing");
        send("synthesis_start", {});

        const synthesis = await generateSynthesis(
          query.question,
          allResponses
        );

        send("synthesis_complete", { content: synthesis });

        await updateQueryStatus(queryId, "complete", { synthesis });

        send("done", { queryId });
      } catch (error) {
        console.error("Generation error:", error);
        send("error", {
          error: error instanceof Error ? error.message : "Generation failed",
        });
        await updateQueryStatus(queryId, "error");
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
