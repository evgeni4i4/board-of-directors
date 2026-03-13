import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { recommendAdvisors } from "@/lib/ai/recommend";
import { buildAdvisorRosterString, ADVISORS } from "@/data/advisors";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const question = body.question?.trim();

  if (!question || question.length < 10) {
    return NextResponse.json(
      { error: "Question must be at least 10 characters" },
      { status: 400 }
    );
  }

  try {
    const roster = buildAdvisorRosterString();
    const result = await recommendAdvisors(question, roster);

    // Enrich with full advisor data
    const enriched = result.recommendations.map((rec) => {
      const advisor = ADVISORS.find((a) => a.slug === rec.slug);
      return { ...rec, advisor };
    }).filter((r) => r.advisor);

    return NextResponse.json({
      topics: result.topics,
      recommendations: enriched,
    });
  } catch (error) {
    console.error("Recommend error:", error);
    return NextResponse.json(
      { error: "Failed to recommend advisors" },
      { status: 500 }
    );
  }
}
