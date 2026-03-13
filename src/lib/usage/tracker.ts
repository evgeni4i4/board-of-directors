import { supabaseAdmin } from "@/lib/supabase";
import { getSubscription } from "@/lib/supabase/queries";

const FREE_QUERIES_PER_WEEK = 3;
const FREE_ADVISORS_PER_QUERY = 2;
const PRO_ADVISORS_PER_QUERY = 6;

function getWeekStart(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = start of week
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString().split("T")[0];
}

export async function getUserPlan(
  userId: string
): Promise<"free" | "pro"> {
  const sub = await getSubscription(userId);
  if (!sub) return "free";
  if (sub.plan === "pro" && sub.status === "active") return "pro";
  return "free";
}

export interface UsageInfo {
  plan: "free" | "pro";
  queriesUsed: number;
  queriesLimit: number | null; // null = unlimited
  advisorsPerQuery: number;
  canQuery: boolean;
}

export async function getUsage(userId: string): Promise<UsageInfo> {
  const plan = await getUserPlan(userId);
  const weekStart = getWeekStart();

  const { data } = await supabaseAdmin
    .from("usage_tracking")
    .select("query_count")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .single();

  const queriesUsed = data?.query_count ?? 0;

  if (plan === "pro") {
    return {
      plan: "pro",
      queriesUsed,
      queriesLimit: null,
      advisorsPerQuery: PRO_ADVISORS_PER_QUERY,
      canQuery: true,
    };
  }

  return {
    plan: "free",
    queriesUsed,
    queriesLimit: FREE_QUERIES_PER_WEEK,
    advisorsPerQuery: FREE_ADVISORS_PER_QUERY,
    canQuery: queriesUsed < FREE_QUERIES_PER_WEEK,
  };
}

export async function incrementUsage(userId: string): Promise<void> {
  const weekStart = getWeekStart();

  const { data: existing } = await supabaseAdmin
    .from("usage_tracking")
    .select("id, query_count")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .single();

  if (existing) {
    await supabaseAdmin
      .from("usage_tracking")
      .update({ query_count: existing.query_count + 1 })
      .eq("id", existing.id);
  } else {
    await supabaseAdmin.from("usage_tracking").insert({
      user_id: userId,
      week_start: weekStart,
      query_count: 1,
    });
  }
}

export async function canQuery(userId: string): Promise<boolean> {
  const usage = await getUsage(userId);
  return usage.canQuery;
}
