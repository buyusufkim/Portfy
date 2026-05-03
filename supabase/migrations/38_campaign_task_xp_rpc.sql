-- 38_campaign_task_xp_rpc.sql

CREATE OR REPLACE FUNCTION complete_campaign_task_and_award_xp(
    p_user_id UUID,
    p_task_id UUID,
    p_today DATE DEFAULT CURRENT_DATE,
    p_now TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
    v_task RECORD;
    v_amount INTEGER := 0;
    v_new_xp INTEGER;
    v_new_level INTEGER;
BEGIN
    -- 1. Lock profile row
    SELECT * INTO v_profile FROM profiles WHERE id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
    END IF;

    -- 2. Lock campaign_tasks row
    SELECT * INTO v_task FROM campaign_tasks WHERE id = p_task_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Task not found');
    END IF;

    IF v_task.user_id != p_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    IF v_task.xp_awarded THEN
        RETURN jsonb_build_object('success', true, 'message', 'Task already completed and XP awarded', 'xp_awarded', 0);
    END IF;

    -- 3. Mark the task completed and xp_awarded
    v_amount := v_task.xp_reward;
    
    UPDATE campaign_tasks SET 
        status = 'completed',
        completed_at = p_now,
        xp_awarded = true,
        updated_at = p_now
    WHERE id = p_task_id;

    -- 4. Calculate new XP and level
    v_new_xp := COALESCE(v_profile.total_xp, 0) + v_amount;
    
    IF v_new_xp >= 15000 THEN v_new_level := 4;
    ELSIF v_new_xp >= 5000 THEN v_new_level := 3;
    ELSIF v_new_xp >= 1000 THEN v_new_level := 2;
    ELSE v_new_level := 1;
    END IF;

    -- 5. Update profiles
    UPDATE profiles SET
        total_xp = v_new_xp,
        broker_level = v_new_level,
        updated_at = p_now
    WHERE id = p_user_id;

    -- 6. Upsert user_stats
    INSERT INTO user_stats (user_id, date, xp_earned)
    VALUES (p_user_id, p_today, v_amount)
    ON CONFLICT (user_id, date) DO UPDATE SET
        xp_earned = user_stats.xp_earned + EXCLUDED.xp_earned,
        updated_at = p_now;

    RETURN jsonb_build_object(
        'success', true,
        'xp_awarded', v_amount,
        'new_total', v_new_xp,
        'new_level', v_new_level
    );
END;
$$ LANGUAGE plpgsql;

NOTIFY pgrst, 'reload schema';
