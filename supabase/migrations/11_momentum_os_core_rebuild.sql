-- Momentum OS Core Rebuild Migration
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- A) Leads table expansion
ALTER TABLE IF EXISTS leads 
ADD COLUMN IF NOT EXISTS next_followup_at timestamptz,
ADD COLUMN IF NOT EXISTS temperature text default 'normal',
ADD COLUMN IF NOT EXISTS silence_risk_level text default 'none',
ADD COLUMN IF NOT EXISTS forget_protection_state text default 'safe',
ADD COLUMN IF NOT EXISTS last_call_result text,
ADD COLUMN IF NOT EXISTS last_call_result_at timestamptz;

-- B) Properties table expansion
ALTER TABLE IF EXISTS properties 
ADD COLUMN IF NOT EXISTS last_status_change_at timestamptz default now(),
ADD COLUMN IF NOT EXISTS last_activity_at timestamptz default now();

-- C) New Tables

-- 1. Lead Activity Log
CREATE TABLE IF NOT EXISTS lead_activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  action_type text not null,
  result text,
  note text,
  scheduled_followup_at timestamptz,
  happened_at timestamptz default now(),
  created_at timestamptz default now()
);

-- 2. Lead Alerts
CREATE TABLE IF NOT EXISTS lead_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  alert_type text not null,
  severity text not null,
  status text not null default 'open',
  triggered_at timestamptz default now(),
  resolved_at timestamptz,
  last_seen_at timestamptz,
  unique(user_id, lead_id, alert_type, status)
);

-- 3. Daily Plan
CREATE TABLE IF NOT EXISTS daily_plan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  plan_date date not null,
  planned_calls integer not null default 0,
  planned_followups integer not null default 0,
  planned_portfolio_actions integer not null default 0,
  completed_calls integer not null default 0,
  completed_followups integer not null default 0,
  completed_portfolio_actions integer not null default 0,
  top3 jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, plan_date)
);

-- 4. Day Closure
CREATE TABLE IF NOT EXISTS day_closure (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  closure_date date not null,
  wins text,
  blockers text,
  tomorrow_top3 jsonb not null default '[]'::jsonb,
  stuck_lead_ids uuid[] not null default '{}',
  stuck_property_ids uuid[] not null default '{}',
  completed_calls integer not null default 0,
  completed_followups integer not null default 0,
  completed_portfolio_actions integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, closure_date)
);

-- 5. Portfolio Blockers
CREATE TABLE IF NOT EXISTS portfolio_blockers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  blocker_type text not null,
  note text,
  impact_score integer not null default 3,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- 6. Owner Portal Events
CREATE TABLE IF NOT EXISTS owner_portal_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  token_id uuid references owner_portal_tokens(id) on delete set null,
  event_type text not null,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

-- D) Security & RLS
ALTER TABLE lead_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_closure ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_blockers ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_portal_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can manage their own lead activity logs" ON lead_activity_log FOR ALL USING (auth.uid() = user_id);
  CREATE POLICY "Users can manage their own lead alerts" ON lead_alerts FOR ALL USING (auth.uid() = user_id);
  CREATE POLICY "Users can manage their own daily plans" ON daily_plan FOR ALL USING (auth.uid() = user_id);
  CREATE POLICY "Users can manage their own day closures" ON day_closure FOR ALL USING (auth.uid() = user_id);
  CREATE POLICY "Users can manage their own portfolio blockers" ON portfolio_blockers FOR ALL USING (auth.uid() = user_id);
  CREATE POLICY "Users can manage their own token events" ON owner_portal_events FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- E) Indexes
CREATE INDEX IF NOT EXISTS idx_lead_activity_log_lead_id_happened ON lead_activity_log(lead_id, happened_at desc);
CREATE INDEX IF NOT EXISTS idx_lead_alerts_user_status_triggered ON lead_alerts(user_id, status, triggered_at desc);
CREATE INDEX IF NOT EXISTS idx_daily_plan_user_date ON daily_plan(user_id, plan_date desc);
CREATE INDEX IF NOT EXISTS idx_day_closure_user_date ON day_closure(user_id, closure_date desc);
CREATE INDEX IF NOT EXISTS idx_portfolio_blockers_prop_active ON portfolio_blockers(property_id, is_active);
CREATE INDEX IF NOT EXISTS idx_owner_portal_events_prop_created ON owner_portal_events(property_id, created_at desc);

-- F) Backfill
UPDATE leads SET last_contacted_at = coalesce(last_contacted_at, CASE WHEN last_contact IS NOT NULL AND last_contact <> '' THEN last_contact::timestamptz ELSE created_at END) WHERE last_contacted_at IS NULL;
UPDATE properties SET last_status_change_at = coalesce(last_status_change_at, created_at) WHERE last_status_change_at IS NULL;
UPDATE properties SET last_activity_at = coalesce(last_activity_at, updated_at, created_at) WHERE last_activity_at IS NULL;
