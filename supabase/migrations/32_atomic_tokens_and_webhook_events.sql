-- Migration 32: Atomic tokens and webhook events
-- 1. Atomic increment of AI tokens
CREATE OR REPLACE FUNCTION increment_ai_tokens(p_user_id uuid, p_tokens int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE profiles
    SET ai_tokens_used = coalesce(ai_tokens_used, 0) + greatest(p_tokens, 0)
    WHERE id = p_user_id;
END;
$$;

-- 2. Meta webhook idempotency table
CREATE TABLE IF NOT EXISTS webhook_events (
    id uuid primary key default gen_random_uuid(),
    provider text not null,
    event_id text not null,
    received_at timestamptz not null default now(),
    processed_at timestamptz,
    status text not null default 'received',
    error text,
    unique(provider, event_id)
);

-- RLS policies for webhook_events (service-only)
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
-- No public policies -> Service role only can modify.
