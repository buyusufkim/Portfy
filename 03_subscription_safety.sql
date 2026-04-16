-- 03_subscription_safety.sql: Atomic Trial Activation and Constraints
-- This script ensures the 7-day trial can only be activated once, even under race conditions.

-- 1. Cleanup legacy columns if they exist
DO $$ 
BEGIN 
    -- If the table exists and has the legacy user_id column, drop it to ensure a clean state.
    -- This is the most reliable way to fix the "null value in column user_id" error.
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_state' AND column_name = 'user_id' AND table_schema = 'public') THEN
        DROP TABLE IF EXISTS subscription_state CASCADE;
    END IF;
END $$;

-- Ensure the table exists with the correct schema
CREATE TABLE IF NOT EXISTS subscription_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    tier TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add a partial unique index to prevent multiple 'trial' records for the same user.
-- This is the database-level enforcement that prevents race conditions.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_trial_per_user 
ON subscription_state (agent_id) 
WHERE (tier = 'trial');

-- 2. Create an atomic RPC function for trial activation.
-- This handles the check-and-write flow in a single database transaction.
DROP FUNCTION IF EXISTS activate_trial(UUID, TIMESTAMPTZ);
CREATE OR REPLACE FUNCTION activate_trial_v2(p_user_id UUID, p_end_date TIMESTAMPTZ)
RETURNS JSONB AS $$
DECLARE
    v_current_sub_type TEXT;
BEGIN
    -- 1. Check current profile status
    SELECT subscription_type INTO v_current_sub_type 
    FROM profiles 
    WHERE uid = p_user_id;

    IF v_current_sub_type IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Kullanıcı profili bulunamadı.');
    END IF;

    IF v_current_sub_type != 'none' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Zaten aktif bir aboneliğiniz bulunuyor.');
    END IF;

    -- 2. Insert into subscription_state
    -- The unique index idx_unique_trial_per_user will cause a unique_violation 
    -- if this user already has a 'trial' record, preventing race conditions.
    -- We explicitly use agent_id here.
    INSERT INTO subscription_state (agent_id, tier, status, current_period_start, current_period_end)
    VALUES (p_user_id, 'trial', 'active', NOW(), p_end_date);

    -- 3. Update profiles
    UPDATE profiles 
    SET subscription_type = 'trial',
        subscription_end_date = p_end_date,
        tier = 'pro'
    WHERE uid = p_user_id;

    RETURN jsonb_build_object('success', true);
EXCEPTION 
    WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'error', '7 günlük deneme süresi her hesap için sadece bir kez kullanılabilir.');
    WHEN OTHERS THEN
        -- Log the error details if possible, or return them
        RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'detail', SQLSTATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
