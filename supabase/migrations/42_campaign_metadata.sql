-- 42_campaign_metadata.sql

-- Add metadata column to advisor_campaigns for storing day starts/closes
ALTER TABLE public.advisor_campaigns
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
