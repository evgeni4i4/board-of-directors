export type AdvisorCategory =
  | "strategy"
  | "startups"
  | "marketing"
  | "leadership"
  | "sales"
  | "investing"
  | "behavioral"
  | "creative";

export type Tier = "free" | "pro";

export interface Advisor {
  slug: string;
  name: string;
  title: string;
  category: AdvisorCategory;
  frameworks: string[];
  expertiseTags: string[];
  portraitUrl: string;
  accentColor: string;
  tier: Tier;
  sortOrder: number;
  shortBio: string;
}

export interface Query {
  id: string;
  userId: string;
  question: string;
  advisorSlugs: string[];
  status: "pending" | "generating" | "complete" | "error";
  synthesis: string | null;
  modelUsed: string;
  createdAt: string;
}

export interface AdvisorResponse {
  id: string;
  queryId: string;
  advisorSlug: string;
  content: string;
  quote: string | null;
  generationTimeMs: number;
}

export interface UsageTracking {
  userId: string;
  weekStart: string;
  queryCount: number;
}

export interface Subscription {
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  plan: "free" | "pro";
  status: "active" | "canceled" | "past_due" | "incomplete";
  currentPeriodEnd: string | null;
}

// SSE event types for streaming
export type SSEEventType =
  | "advisor_start"
  | "advisor_chunk"
  | "advisor_complete"
  | "synthesis_start"
  | "synthesis_chunk"
  | "synthesis_complete"
  | "error"
  | "done";

export interface SSEEvent {
  type: SSEEventType;
  advisorSlug?: string;
  content?: string;
  quote?: string;
  error?: string;
}
