-- Repair script to ensure completed_at in tasks and week_start_date in weekly_reports exist

-- 1. tasks.completed_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tasks'
        AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. weekly_reports.week_start_date
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'weekly_reports'
        AND column_name = 'week_start_date'
    ) THEN
        ALTER TABLE public.weekly_reports ADD COLUMN week_start_date DATE;
    END IF;
END $$;
