-- Add missing fields to tasks table for Activity and Drip Campaigns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='lead_id') THEN
        ALTER TABLE tasks ADD COLUMN lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='notes') THEN
        ALTER TABLE tasks ADD COLUMN notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='due_date') THEN
        ALTER TABLE tasks ADD COLUMN due_date TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='is_drip') THEN
        ALTER TABLE tasks ADD COLUMN is_drip BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='ai_suggestion') THEN
        ALTER TABLE tasks ADD COLUMN ai_suggestion TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='drip_type') THEN
        ALTER TABLE tasks ADD COLUMN drip_type TEXT;
    END IF;
END $$;
