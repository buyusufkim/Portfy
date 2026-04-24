-- 03_subscription_safety.sql: Atomic Trial Activation and Constraints
-- This script ensures the 7-day trial can only be activated once.

-- Ensure the table exists with the correct schema
CREATE TABLE IF NOT EXISTS subscription_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tier TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add a partial unique index to prevent multiple 'trial' records for the same user.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_trial_per_user 
ON subscription_state (user_id) 
WHERE (tier = 'trial');

-- 3. Create an atomic RPC function for trial activation.
DROP FUNCTION IF EXISTS activate_trial(UUID, TIMESTAMPTZ);
CREATE OR REPLACE FUNCTION activate_trial_v2(p_user_id UUID, p_end_date TIMESTAMPTZ)
RETURNS JSONB AS $$
DECLARE
    v_current_sub_type TEXT;
BEGIN
    -- 1. Check current profile status
    SELECT subscription_type INTO v_current_sub_type 
    FROM profiles 
    WHERE id = p_user_id;

    IF v_current_sub_type IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Kullanıcı profili bulunamadı.');
    END IF;

    IF v_current_sub_type != 'none' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Zaten aktif bir aboneliğiniz bulunuyor.');
    END IF;

    -- 2. Insert into subscription_state
    INSERT INTO subscription_state (user_id, tier, status, current_period_start, current_period_end)
    VALUES (p_user_id, 'trial', 'active', NOW(), p_end_date);

    -- 3. Update profiles
    UPDATE profiles 
    SET subscription_type = 'trial',
        subscription_end_date = p_end_date,
        tier = 'pro'
    WHERE id = p_user_id;

    RETURN jsonb_build_object('success', true);
EXCEPTION 
    WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'error', '7 günlük deneme süresi her hesap için sadece bir kez kullanılabilir.');
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'detail', SQLSTATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
