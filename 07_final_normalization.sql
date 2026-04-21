-- 07_final_normalization.sql
-- Final migration to enforce single standard: id for PK, user_id for FK.
-- This script safely merges data from legacy columns into user_id and cleans them up.

DO $$ 
DECLARE 
    tbl text;
    col text;
BEGIN
    -- 1. Profiles Table Normalization
    -- Ensure profiles PK is 'id' and not 'uid'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'uid' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'id' AND table_schema = 'public') THEN
            ALTER TABLE profiles RENAME COLUMN uid TO id;
        ELSE
            -- If both exist, we assume id is correct from 01_schema additions.
            ALTER TABLE profiles DROP COLUMN uid CASCADE;
        END IF;
    END IF;

    -- 2. Bulk Merge legacy columns to user_id across all tables
    FOR col IN SELECT unnest(ARRAY['agent_id', 'agentId', 'uid', 'userId'])
    LOOP
        FOR tbl IN 
            SELECT table_name 
            FROM information_schema.columns 
            WHERE column_name = col 
            AND table_schema = 'public'
            AND table_name != 'profiles'
        LOOP
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = tbl AND column_name = 'user_id' AND table_schema = 'public') THEN
                EXECUTE format('ALTER TABLE %I RENAME COLUMN %I TO user_id', tbl, col);
            ELSE
                -- Merge data if user_id is empty, then drop legacy column
                EXECUTE format('UPDATE %I SET user_id = %I WHERE user_id IS NULL AND %I IS NOT NULL', tbl, col, col);
                EXECUTE format('ALTER TABLE %I DROP COLUMN %I CASCADE', tbl, col);
            END IF;
        END LOOP;
    END LOOP;

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
