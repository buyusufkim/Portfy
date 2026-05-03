-- 36_campaign_90_hardening.sql

-- Add xp_awarded boolean to campaign_tasks if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaign_tasks' AND column_name = 'xp_awarded') THEN
        ALTER TABLE campaign_tasks ADD COLUMN xp_awarded BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- Create unique index to prevent duplicate tasks per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_tasks_unique_day 
ON campaign_tasks (campaign_id, user_id, task_key, due_date);

-- Create index for faster campaign score lookups
CREATE INDEX IF NOT EXISTS idx_campaign_scores_lookup 
ON campaign_daily_scores (campaign_id, user_id, score_date);

-- Notify postgrest to reload the schema schema cache
NOTIFY pgrst, 'reload schema';
