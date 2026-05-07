CREATE OR REPLACE FUNCTION award_day_xp_event(
    p_user_id UUID,
    p_action_type TEXT,
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
    v_last_started_date DATE;
    v_last_closed_date DATE;
BEGIN
    SELECT * INTO v_profile FROM profiles WHERE id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
    END IF;

    IF p_action_type = 'START_DAY' THEN
        v_last_started_date := (v_profile.last_day_started_at AT TIME ZONE 'Europe/Istanbul')::DATE;
        IF v_last_started_date = p_today THEN
            RETURN jsonb_build_object('success', true, 'message', 'Day already started today', 'xp_awarded', 0);
        END IF;

        -- Early start log
        IF p_stats ? 'early_start_reason' AND p_stats->>'early_start_reason' IS NOT NULL AND p_stats->>'early_start_reason' != '' THEN
            INSERT INTO work_discipline_logs (user_id, log_date, type, scheduled_time, actual_time, reason)
            VALUES (p_user_id, p_today, 'early_start', v_profile.work_start_time, p_now, p_stats->>'early_start_reason');
        END IF;

        -- Missed close penalty
        v_last_closed_date := (v_profile.last_ritual_completed_at AT TIME ZONE 'Europe/Istanbul')::DATE;
        IF v_last_started_date IS NOT NULL AND v_last_started_date < p_today THEN
            IF v_last_closed_date IS NULL OR v_last_closed_date != v_last_started_date THEN
                INSERT INTO work_discipline_logs (user_id, log_date, type, actual_time, reason, xp_delta)
                VALUES (p_user_id, v_last_started_date, 'missed_close_penalty', p_now, 'Önceki gün kapatılmadan yeni gün başlatıldı', -50);
                
                v_profile.total_xp := GREATEST(0, COALESCE(v_profile.total_xp, 0) - 50);
            END IF;
        END IF;

        v_amount := 50;
        
    ELSIF p_action_type = 'END_DAY' THEN
        IF (v_profile.last_end_day_xp_at AT TIME ZONE 'Europe/Istanbul')::DATE = p_today THEN
            RETURN jsonb_build_object('success', true, 'message', 'End day XP already awarded for today', 'xp_awarded', 0);
        END IF;

        -- Early close log
        IF p_stats ? 'early_close_reason' AND p_stats->>'early_close_reason' IS NOT NULL AND p_stats->>'early_close_reason' != '' THEN
            INSERT INTO work_discipline_logs (user_id, log_date, type, scheduled_time, actual_time, reason)
            VALUES (p_user_id, p_today, 'early_close', v_profile.work_end_time, p_now, p_stats->>'early_close_reason');
        END IF;

        v_amount := 150;
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Invalid action type');
    END IF;

    v_new_xp := COALESCE(v_profile.total_xp, 0) + v_amount;
    IF v_new_xp >= 15000 THEN v_new_level := 4;
    ELSIF v_new_xp >= 5000 THEN v_new_level := 3;
    ELSIF v_new_xp >= 1000 THEN v_new_level := 2;
    ELSE v_new_level := 1;
    END IF;

    v_new_streak := COALESCE(v_profile.current_streak, 0);
    IF p_action_type = 'END_DAY' THEN
        IF v_profile.last_ritual_completed_at IS NULL OR (v_profile.last_ritual_completed_at AT TIME ZONE 'Europe/Istanbul')::DATE != p_today THEN
            IF v_profile.last_ritual_completed_at IS NOT NULL AND (v_profile.last_ritual_completed_at AT TIME ZONE 'Europe/Istanbul')::DATE = (p_today - INTERVAL '1 day')::DATE THEN
                v_new_streak := v_new_streak + 1;
            ELSE
                v_new_streak := 1;
            END IF;
        END IF;
    END IF;

    UPDATE profiles SET
        total_xp = v_new_xp,
        broker_level = v_new_level,
        current_streak = COALESCE(v_new_streak, current_streak),
        longest_streak = GREATEST(COALESCE(v_new_streak, current_streak), longest_streak),
        last_active_date = CASE WHEN p_action_type = 'END_DAY' THEN p_today ELSE COALESCE(last_active_date, p_today) END,
        last_day_started_at = CASE WHEN p_action_type = 'START_DAY' THEN p_now ELSE last_day_started_at END,
        last_morning_ritual_xp_at = CASE WHEN p_action_type = 'START_DAY' THEN p_now ELSE last_morning_ritual_xp_at END,
        last_ritual_completed_at = CASE WHEN p_action_type = 'END_DAY' THEN p_now ELSE last_ritual_completed_at END,
        last_end_day_xp_at = CASE WHEN p_action_type = 'END_DAY' THEN p_now ELSE last_end_day_xp_at END,
        updated_at = p_now
    WHERE id = p_user_id;

    INSERT INTO user_stats (user_id, date, xp_earned, day_started_at, day_ended_at, tasks_completed, calls_made, visits_made, potential_revenue_handled)
    VALUES (
        p_user_id, 
        p_today, 
        v_amount, 
        CASE WHEN p_action_type = 'START_DAY' THEN p_now ELSE NULL END,
        CASE WHEN p_action_type = 'END_DAY' THEN p_now ELSE NULL END,
        COALESCE((p_stats->>'tasks_completed')::INTEGER, 0),
        COALESCE((p_stats->>'calls_made')::INTEGER, 0),
        COALESCE((p_stats->>'visits_made')::INTEGER, 0),
        COALESCE((p_stats->>'potential_revenue_handled')::NUMERIC, 0)
    )
    ON CONFLICT (user_id, date) DO UPDATE SET
        xp_earned = user_stats.xp_earned + EXCLUDED.xp_earned,
        day_started_at = CASE WHEN EXCLUDED.day_started_at IS NOT NULL AND user_stats.day_started_at IS NULL THEN EXCLUDED.day_started_at ELSE user_stats.day_started_at END,
        day_ended_at = COALESCE(EXCLUDED.day_ended_at, user_stats.day_ended_at),
        tasks_completed = GREATEST(user_stats.tasks_completed, EXCLUDED.tasks_completed),
        calls_made = GREATEST(user_stats.calls_made, EXCLUDED.calls_made),
        visits_made = GREATEST(user_stats.visits_made, EXCLUDED.visits_made),
        potential_revenue_handled = GREATEST(user_stats.potential_revenue_handled, EXCLUDED.potential_revenue_handled),
        updated_at = p_now
    ;

    RETURN jsonb_build_object(
        'success', true,
        'xp_awarded', v_amount,
        'new_total', v_new_xp,
        'new_level', v_new_level,
        'new_streak', v_new_streak
    );
END;
$$ LANGUAGE plpgsql;
