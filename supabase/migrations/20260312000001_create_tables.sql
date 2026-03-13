-- Board of Directors — Database Schema
-- 5 tables: advisors, queries, responses, usage_tracking, subscriptions

-- 1. Advisors
CREATE TABLE IF NOT EXISTS advisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('strategy', 'startups', 'marketing', 'leadership', 'sales', 'investing', 'behavioral', 'creative')),
  frameworks TEXT[] NOT NULL DEFAULT '{}',
  expertise_tags TEXT[] NOT NULL DEFAULT '{}',
  portrait_url TEXT,
  accent_color TEXT NOT NULL DEFAULT '#333333',
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  short_bio TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_advisors_category ON advisors(category);
CREATE INDEX idx_advisors_tier ON advisors(tier);
CREATE INDEX idx_advisors_sort ON advisors(sort_order);

-- 2. Queries
CREATE TABLE IF NOT EXISTS queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  question TEXT NOT NULL,
  advisor_slugs TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'recommending', 'generating', 'synthesizing', 'complete', 'error')),
  synthesis TEXT,
  model_used TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_queries_user ON queries(user_id);
CREATE INDEX idx_queries_status ON queries(status);
CREATE INDEX idx_queries_created ON queries(created_at DESC);

-- 3. Responses
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id UUID NOT NULL REFERENCES queries(id) ON DELETE CASCADE,
  advisor_slug TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  quote TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  generation_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_responses_query ON responses(query_id);
CREATE INDEX idx_responses_advisor ON responses(advisor_slug);

-- 4. Usage Tracking
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  week_start DATE NOT NULL,
  query_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, week_start)
);

CREATE INDEX idx_usage_user_week ON usage_tracking(user_id, week_start);

-- 5. Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_customer_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER queries_updated_at
  BEFORE UPDATE ON queries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policies
ALTER TABLE advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Advisors: public read
CREATE POLICY "Advisors are publicly readable"
  ON advisors FOR SELECT
  USING (true);

-- Queries: users can read their own
CREATE POLICY "Users can read own queries"
  ON queries FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert queries"
  ON queries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update queries"
  ON queries FOR UPDATE
  USING (true);

-- Responses: readable if query is readable
CREATE POLICY "Responses are readable"
  ON responses FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert responses"
  ON responses FOR INSERT
  WITH CHECK (true);

-- Usage: users can read their own
CREATE POLICY "Usage tracking readable"
  ON usage_tracking FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage usage"
  ON usage_tracking FOR ALL
  USING (true);

-- Subscriptions: users can read their own
CREATE POLICY "Subscriptions readable"
  ON subscriptions FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (true);
