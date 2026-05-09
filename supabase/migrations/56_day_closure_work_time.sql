-- Add work time columns to day_closure table idempotently
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'day_closure' AND column_name = 'day_started_at') THEN
        ALTER TABLE day_closure ADD COLUMN day_started_at timestamptz NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'day_closure' AND column_name = 'day_closed_at') THEN
        ALTER TABLE day_closure ADD COLUMN day_closed_at timestamptz NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'day_closure' AND column_name = 'work_duration_minutes') THEN
        ALTER TABLE day_closure ADD COLUMN work_duration_minutes int NULL;
    END IF;
END $$;

-- Update the Supabase realtime if needed, though day_closure might not be realtime
