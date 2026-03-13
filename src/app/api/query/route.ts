import { getAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createQuery } from "@/lib/supabase/queries";
import { canQuery, incrementUsage, getUserPlan } from "@/lib/usage/tracker";
import { ADVISORS } from "@/data/advisors";

export async function POST(req: Request) {
  const { userId } = await getAuth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const question = body.question?.trim();
  const advisorSlugs: string[] = body.advisorSlugs || [];

  if (!question || question.length < 10) {
    return NextResponse.json(
      { error: "Question must be at least 10 characters" },
      { status: 400 }
    );
  }

  if (advisorSlugs.length === 0 || advisorSlugs.length > 6) {
    return NextResponse.json(
      { error: "Select 1-6 advisors" },
      { status: 400 }
    );
  }

  // Check usage limits
  const allowed = await canQuery(userId);
  if (!allowed) {
    return NextResponse.json(
      { error: "Weekly query limit reached. Upgrade to Pro for unlimited queries." },
      { status: 403 }
    );
  }

  // Validate advisor access
  const plan = await getUserPlan(userId);
  if (plan === "free") {
    if (advisorSlugs.length > 2) {
      return NextResponse.json(
        { error: "Free tier: max 2 advisors per query" },
        { status: 403 }
      );
    }
    const hasProAdvisor = advisorSlugs.some((slug) => {
      const advisor = ADVISORS.find((a) => a.slug === slug);
      return advisor?.tier === "pro";
    });
    if (hasProAdvisor) {
      return NextResponse.json(
        { error: "Upgrade to Pro to access this advisor" },
        { status: 403 }
      );
    }
  }

  try {
    const modelUsed = plan === "pro" ? "claude-opus-4-6" : "claude-sonnet-4-5-20250929";
    const query = await createQuery(userId, question, advisorSlugs, modelUsed);
    await incrementUsage(userId);

    return NextResponse.json({ queryId: query.id });
  } catch (error) {
    console.error("Query creation error:", error);
    return NextResponse.json(
      { error: "Failed to create query" },
      { status: 500 }
    );
  }
}
