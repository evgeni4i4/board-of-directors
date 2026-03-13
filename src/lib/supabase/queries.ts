import { supabaseAdmin } from "@/lib/supabase";

// === Advisors ===

export async function getAdvisors() {
  const { data, error } = await supabaseAdmin
    .from("advisors")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return data;
}

export async function getAdvisorsBySlugs(slugs: string[]) {
  const { data, error } = await supabaseAdmin
    .from("advisors")
    .select("*")
    .in("slug", slugs)
    .order("sort_order");
  if (error) throw error;
  return data;
}

// === Queries ===

export async function createQuery(
  userId: string,
  question: string,
  advisorSlugs: string[],
  modelUsed: string
) {
  const { data, error } = await supabaseAdmin
    .from("queries")
    .insert({
      user_id: userId,
      question,
      advisor_slugs: advisorSlugs,
      status: "pending",
      model_used: modelUsed,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getQuery(queryId: string) {
  const { data, error } = await supabaseAdmin
    .from("queries")
    .select("*")
    .eq("id", queryId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateQueryStatus(
  queryId: string,
  status: string,
  extra?: { synthesis?: string; input_tokens?: number; output_tokens?: number }
) {
  const { error } = await supabaseAdmin
    .from("queries")
    .update({ status, ...extra })
    .eq("id", queryId);
  if (error) throw error;
}

// === Responses ===

export async function createResponse(
  queryId: string,
  advisorSlug: string,
  content: string,
  quote: string | null,
  generationTimeMs: number,
  tokens?: { input_tokens?: number; output_tokens?: number }
) {
  const { data, error } = await supabaseAdmin
    .from("responses")
    .insert({
      query_id: queryId,
      advisor_slug: advisorSlug,
      content,
      quote,
      generation_time_ms: generationTimeMs,
      ...tokens,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getResponsesByQuery(queryId: string) {
  const { data, error } = await supabaseAdmin
    .from("responses")
    .select("*")
    .eq("query_id", queryId)
    .order("created_at");
  if (error) throw error;
  return data;
}

export async function getQueryWithResponses(queryId: string) {
  const query = await getQuery(queryId);
  const responses = await getResponsesByQuery(queryId);
  const advisors = await getAdvisorsBySlugs(
    query.advisor_slugs as string[]
  );
  return { query, responses, advisors };
}

// === Subscriptions ===

export async function getSubscription(userId: string) {
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data;
}

export async function upsertSubscription(
  userId: string,
  fields: {
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    plan?: string;
    status?: string;
    current_period_end?: string;
  }
) {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .upsert({ user_id: userId, ...fields }, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}
