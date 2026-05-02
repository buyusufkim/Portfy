-- Migration 28: Add source and auto_verify columns to gamified_tasks

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamified_tasks' AND column_name='source') THEN
        ALTER TABLE gamified_tasks ADD COLUMN source TEXT DEFAULT 'system';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamified_tasks' AND column_name='auto_verify') THEN
        ALTER TABLE gamified_tasks ADD COLUMN auto_verify BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
