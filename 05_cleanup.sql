-- 05_cleanup.sql: Final Database Cleanup
-- This script ensures all tables have consistent column names and removes legacy columns.

DO $$ 
DECLARE
    t text;
BEGIN 
    FOR t IN SELECT unnest(ARRAY[
        'tasks', 'task_completions', 'leads', 'properties', 
        'daily_briefings', 'ai_insights', 'whatsapp_imports', 
        'performance_snapshots', 'subscription_state', 'gamified_tasks', 
        'categories', 'user_stats', 'rescue_sessions', 'field_visits', 
        'map_pins', 'notes', 'personal_tasks', 'message_templates', 
        'broker_accounts', 'external_listings'
    ])
    LOOP
        -- 1. Ensure agent_id exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'agent_id' AND table_schema = 'public') THEN
            -- Try to rename any existing variant first
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'user_id' AND table_schema = 'public') THEN
                EXECUTE format('ALTER TABLE %I RENAME COLUMN "user_id" TO agent_id', t);
            ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'agentId' AND table_schema = 'public') THEN
                EXECUTE format('ALTER TABLE %I RENAME COLUMN "agentId" TO agent_id', t);
            ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'userId' AND table_schema = 'public') THEN
                EXECUTE format('ALTER TABLE %I RENAME COLUMN "userId" TO agent_id', t);
            ELSE
                EXECUTE format('ALTER TABLE %I ADD COLUMN agent_id UUID REFERENCES profiles(uid) ON DELETE CASCADE', t);
            END IF;
        END IF;

        -- 2. Drop legacy columns if they still exist
        -- We already tried to rename them above, so if they still exist, they are extra columns
        BEGIN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN "user_id" DROP NOT NULL', t);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
            EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS "user_id" CASCADE', t);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        
        BEGIN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN "agentId" DROP NOT NULL', t);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
            EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS "agentId" CASCADE', t);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        
        BEGIN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN "userId" DROP NOT NULL', t);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
            EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS "userId" CASCADE', t);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;

        -- 3. Ensure agent_id is NOT NULL where required
        -- For subscription_state, it MUST be NOT NULL
        IF t = 'subscription_state' THEN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN agent_id SET NOT NULL', t);
        END IF;
    END LOOP;
END $$;
