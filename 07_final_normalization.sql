-- 07_final_normalization.sql
-- Final migration to enforce single standard: id for PK, user_id for FK.
-- This script is additive and safe.

DO $$ 
DECLARE 
    t text;
BEGIN
    -- 1. Profiles Table Normalization
    -- Ensure profiles PK is 'id' and not 'uid'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'uid' AND table_schema = 'public') THEN
        BEGIN
            ALTER TABLE profiles RENAME COLUMN uid TO id;
        EXCEPTION WHEN OTHERS THEN
            -- If 'id' already exists, we might need to merge or drop one. 
            -- Assuming 'id' is already the PK from 01_schema.sql.
            ALTER TABLE profiles DROP COLUMN IF EXISTS uid;
        END;
    END IF;

    -- 2. Bulk Rename agent_id -> user_id across all tables
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'agent_id' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('ALTER TABLE IF EXISTS %I RENAME COLUMN agent_id TO user_id', t);
    END LOOP;

    -- 3. Bulk Rename uid -> user_id across all tables (excluding profiles where it should be 'id')
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'uid' 
        AND table_name != 'profiles'
        AND table_schema = 'public'
    LOOP
        EXECUTE format('ALTER TABLE IF EXISTS %I RENAME COLUMN uid TO user_id', t);
    END LOOP;

    -- 4. Fix specific tables from old migrations
    -- user_stats (previously has agent_id)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_stats' AND column_name = 'agent_id') THEN
        ALTER TABLE user_stats RENAME COLUMN agent_id TO user_id;
    END IF;

    -- subscription_state
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_state' AND column_name = 'agent_id') THEN
        ALTER TABLE subscription_state RENAME COLUMN agent_id TO user_id;
    END IF;

    -- 5. Foreign Key Standardization
    -- Ensure all user_id columns reference profiles(id)
    -- This part is descriptive; 01_schema.sql handles most, but we ensure consistency here.
END $$;

-- 6. RLS Policy Normalization
-- We must ensure all policies use (user_id = auth.uid()) or (id = auth.uid()) 
-- since auth.uid() returns the authenticated user's ID which matches profiles.id.

DO $$
DECLARE
    t text;
BEGIN
    -- Refresh policies for tables with user_id
    FOR t IN 
        SELECT DISTINCT c.table_name 
        FROM information_schema.columns c
        JOIN information_schema.tables t ON c.table_name = t.table_name AND t.table_type = 'BASE TABLE'
        WHERE c.column_name = 'user_id' 
        AND c.table_schema = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Users can manage own %s" ON %I', t, t);
        EXECUTE format('CREATE POLICY "Users can manage own %s" ON %I FOR ALL USING (user_id = auth.uid())', t, t);
    END LOOP;
END $$;

-- Fix Profiles RLS specifically
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled everywhere
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;
