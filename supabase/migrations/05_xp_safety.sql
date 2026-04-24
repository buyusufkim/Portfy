-- 04_xp_safety.sql: Atomic XP Awarding and Constraints

-- 1. Cleanup duplicates if any before adding constraint
DELETE FROM user_stats a USING user_stats b
WHERE a.id < b.id AND a.user_id = b.user_id AND a.date = b.date;

-- 2. Add unique constraint to user_stats to prevent duplicate rows per day
-- This allows us to use ON CONFLICT for atomic updates.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_date') THEN
        ALTER TABLE user_stats ADD CONSTRAINT unique_user_date UNIQUE (user_id, date);
    END IF;
END $$;

-- 3. Atomic XP Awarding Function
CREATE OR REPLACE FUNCTION award_xp(
    p_user_id UUID,
    p_action_type TEXT,
    p_entity_id UUID DEFAULT NULL,
    p_today DATE DEFAULT CURRENT_DATE,
    p_now TIMESTAMPTZ DEFAULT NOW(),
    p_stats JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
    v_amount INTEGER := 0;
    v_new_xp INTEGER;
    v_new_level INTEGER;
    v_new_streak INTEGER;
    v_entity RECORD;
BEGIN
    -- 1. Lock profile row to prevent concurrent XP updates for the same user
    SELECT * INTO v_profile FROM profiles WHERE id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
    END IF;

    -- 2. Determine amount and check eligibility atomically
    CASE p_action_type
        WHEN 'MORNING_RITUAL' THEN
            IF v_profile.last_morning_ritual_xp_at::DATE = p_today THEN
                RETURN jsonb_build_object('success', false, 'error', 'Morning ritual XP already awarded for today');
            END IF;
            v_amount := 50;
        
        WHEN 'EVENING_RITUAL' THEN
            IF v_profile.last_evening_ritual_xp_at::DATE = p_today THEN
                RETURN jsonb_build_object('success', false, 'error', 'Evening ritual XP already awarded for today');
            END IF;
            v_amount := 100;
            
        WHEN 'END_DAY' THEN
            IF v_profile.last_end_day_xp_at::DATE = p_today THEN
                RETURN jsonb_build_object('success', false, 'error', 'End day XP already awarded for today');
            END IF;
            v_amount := 150;

        WHEN 'START_DAY' THEN
            v_amount := 0;

        WHEN 'ADD_LEAD' THEN
            -- Lock lead row to prevent concurrent XP awards for the same lead
            SELECT * INTO v_entity FROM leads WHERE id = p_entity_id FOR UPDATE;
            IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Lead not found'); END IF;
            IF v_entity.user_id != p_user_id THEN RETURN jsonb_build_object('success', false, 'error', 'Unauthorized'); END IF;
            IF v_entity.xp_awarded THEN RETURN jsonb_build_object('success', false, 'error', 'XP already awarded'); END IF;
            v_amount := 20;
            UPDATE leads SET xp_awarded = true WHERE id = p_entity_id;

        WHEN 'ADD_PROPERTY' THEN
            -- Lock property row
            SELECT * INTO v_entity FROM properties WHERE id = p_entity_id FOR UPDATE;
            IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Property not found'); END IF;
            IF v_entity.user_id != p_user_id THEN RETURN jsonb_build_object('success', false, 'error', 'Unauthorized'); END IF;
            IF v_entity.xp_awarded THEN RETURN jsonb_build_object('success', false, 'error', 'XP already awarded'); END IF;
            v_amount := 50;
            UPDATE properties SET xp_awarded = true WHERE id = p_entity_id;

        WHEN 'RESCUE_SESSION_BONUS' THEN
            -- Lock session row
            SELECT * INTO v_entity FROM rescue_sessions WHERE id = p_entity_id FOR UPDATE;
            IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Session not found'); END IF;
            IF v_entity.user_id != p_user_id THEN RETURN jsonb_build_object('success', false, 'error', 'Unauthorized'); END IF;
            IF v_entity.xp_awarded THEN RETURN jsonb_build_object('success', false, 'error', 'XP already awarded'); END IF;
            IF v_entity.status != 'completed' THEN RETURN jsonb_build_object('success', false, 'error', 'Session not completed'); END IF;
            v_amount := 150;
            UPDATE rescue_sessions SET xp_awarded = true WHERE id = p_entity_id;

        WHEN 'COMPLETE_BASIC_TASK' THEN
            -- Lock personal task row
            SELECT * INTO v_entity FROM personal_tasks WHERE id = p_entity_id FOR UPDATE;
            IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Task not found'); END IF;
            IF v_entity.user_id != p_user_id THEN RETURN jsonb_build_object('success', false, 'error', 'Unauthorized'); END IF;
            IF v_entity.xp_awarded THEN RETURN jsonb_build_object('success', false, 'error', 'XP already awarded'); END IF;
            IF NOT v_entity.is_completed THEN RETURN jsonb_build_object('success', false, 'error', 'Task not completed'); END IF;
            v_amount := 10;
            UPDATE personal_tasks SET xp_awarded = true WHERE id = p_entity_id;

        WHEN 'COMPLETE_TASK' THEN
            -- Lock gamified task row
            SELECT * INTO v_entity FROM gamified_tasks WHERE id = p_entity_id FOR UPDATE;
            IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Task not found'); END IF;
            IF v_entity.user_id != p_user_id THEN RETURN jsonb_build_object('success', false, 'error', 'Unauthorized'); END IF;
            IF v_entity.xp_awarded THEN RETURN jsonb_build_object('success', false, 'error', 'XP already awarded'); END IF;
            IF NOT v_entity.is_completed THEN RETURN jsonb_build_object('success', false, 'error', 'Task not completed'); END IF;
            v_amount := COALESCE(v_entity.points, 10);
            UPDATE gamified_tasks SET xp_awarded = true WHERE id = p_entity_id;

        ELSE
            RETURN jsonb_build_object('success', false, 'error', 'Invalid action type');
    END CASE;

    -- 3. Calculate new XP and Level
    v_new_xp := COALESCE(v_profile.total_xp, 0) + v_amount;
    IF v_new_xp >= 15000 THEN v_new_level := 4;
    ELSIF v_new_xp >= 5000 THEN v_new_level := 3;
    ELSIF v_new_xp >= 1000 THEN v_new_level := 2;
    ELSE v_new_level := 1;
    END IF;

    -- 4. Streak logic (only for EVENING_RITUAL)
    v_new_streak := v_profile.current_streak;
    IF p_action_type = 'EVENING_RITUAL' AND (v_profile.last_active_date IS NULL OR v_profile.last_active_date != p_today) THEN
        IF v_profile.last_active_date = (p_today - INTERVAL '1 day')::DATE THEN
            v_new_streak := v_new_streak + 1;
        ELSE
            v_new_streak := 1;
        END IF;
    END IF;

    -- 5. Update Profile
    UPDATE profiles SET
        total_xp = v_new_xp,
        broker_level = v_new_level,
        current_streak = v_new_streak,
        longest_streak = GREATEST(v_new_streak, longest_streak),
        last_active_date = p_today,
        last_day_started_at = CASE WHEN p_action_type IN ('MORNING_RITUAL', 'START_DAY') THEN p_now ELSE last_day_started_at END,
        last_ritual_completed_at = CASE WHEN p_action_type IN ('EVENING_RITUAL', 'END_DAY') THEN p_now ELSE last_ritual_completed_at END,
        last_morning_ritual_xp_at = CASE WHEN p_action_type = 'MORNING_RITUAL' THEN p_now ELSE last_morning_ritual_xp_at END,
        last_evening_ritual_xp_at = CASE WHEN p_action_type = 'EVENING_RITUAL' THEN p_now ELSE last_evening_ritual_xp_at END,
        last_end_day_xp_at = CASE WHEN p_action_type = 'END_DAY' THEN p_now ELSE last_end_day_xp_at END,
        updated_at = p_now
    WHERE id = p_user_id;

    -- 6. Update user_stats atomically using ON CONFLICT
    INSERT INTO user_stats (user_id, date, xp_earned, day_started_at, day_ended_at, tasks_completed, calls_made, visits_made, potential_revenue_handled)
    VALUES (
        p_user_id, 
        p_today, 
        v_amount, 
        CASE WHEN p_action_type = 'START_DAY' THEN p_now ELSE NULL END,
        CASE WHEN p_action_type IN ('END_DAY', 'EVENING_RITUAL') THEN p_now ELSE NULL END,
        COALESCE((p_stats->>'tasks_completed')::INTEGER, 0),
        COALESCE((p_stats->>'calls_made')::INTEGER, 0),
        COALESCE((p_stats->>'visits_made')::INTEGER, 0),
        COALESCE((p_stats->>'potential_revenue_handled')::NUMERIC, 0)
    )
    ON CONFLICT (user_id, date) DO UPDATE SET
        xp_earned = user_stats.xp_earned + EXCLUDED.xp_earned,
        day_started_at = COALESCE(user_stats.day_started_at, EXCLUDED.day_started_at),
        day_ended_at = COALESCE(EXCLUDED.day_ended_at, user_stats.day_ended_at),
        tasks_completed = GREATEST(user_stats.tasks_completed, EXCLUDED.tasks_completed),
        calls_made = GREATEST(user_stats.calls_made, EXCLUDED.calls_made),
        visits_made = GREATEST(user_stats.visits_made, EXCLUDED.visits_made),
        potential_revenue_handled = GREATEST(user_stats.potential_revenue_handled, EXCLUDED.potential_revenue_handled),
        updated_at = p_now;

    RETURN jsonb_build_object(
        'success', true, 
        'total_xp', v_new_xp, 
        'broker_level', v_new_level, 
        'awarded', v_amount,
        'current_streak', v_new_streak
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
