-- Drop the index we created in 58
DO $$
BEGIN
    IF to_regclass('public.user_activity_log_unique_rescue_bonus') IS NOT NULL THEN
        DROP INDEX IF EXISTS public.user_activity_log_unique_rescue_bonus;
    END IF;
END $$;

-- Add xp_awarded to rescue_sessions if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rescue_sessions' AND column_name = 'xp_awarded') THEN
        ALTER TABLE public.rescue_sessions ADD COLUMN xp_awarded BOOLEAN DEFAULT false;
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.award_rescue_session_bonus(
    p_user_id UUID,
    p_session_id UUID,
    p_today DATE,
    p_now TIMESTAMPTZ DEFAULT NOW(),
    p_xp_to_award INT DEFAULT 100
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile RECORD;
    v_session RECORD;
    v_new_xp INT;
    v_new_level INT;
    v_task JSONB;
    v_all_completed BOOLEAN := true;
BEGIN
    -- 1. Lock profile row
    SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
    END IF;

    -- 2. Lock rescue session row
    SELECT * INTO v_session FROM public.rescue_sessions WHERE id = p_session_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Session not found');
    END IF;

    -- 3. Validation
    IF v_profile.last_day_started_at IS NULL OR ((v_profile.last_day_started_at AT TIME ZONE 'Europe/Istanbul')::DATE) != p_today THEN
        RETURN jsonb_build_object('success', false, 'error', 'Gün başlatılmadan bu aksiyon çalışmaz.');
    END IF;

    IF EXISTS (SELECT 1 FROM public.day_closure WHERE user_id = p_user_id AND closure_date = p_today) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Gün kapatıldıktan sonra kurtarma seansı tamamlanamaz.');
    END IF;

    IF v_session.user_id != p_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bu oturum size ait değil.');
    END IF;

    IF v_session.date != p_today THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sadece bugünkü kurtarma seansları için XP alınabilir.');
    END IF;

    IF v_session.xp_awarded = true THEN
        RETURN jsonb_build_object('success', true, 'message', 'XP already awarded', 'xp_awarded', 0);
    END IF;

    -- Check if all tasks are completed
    IF jsonb_typeof(v_session.tasks) != 'array' OR jsonb_array_length(v_session.tasks) = 0 THEN
         RETURN jsonb_build_object('success', false, 'error', 'Kurtarma görevleri tamamlanmadan XP verilemez.');
    END IF;

    FOR v_task IN SELECT * FROM jsonb_array_elements(v_session.tasks)
    LOOP
        IF (v_task->>'is_completed')::boolean IS NOT TRUE THEN
            v_all_completed := false;
            EXIT;
        END IF;
    END LOOP;

    IF NOT v_all_completed THEN
        RETURN jsonb_build_object('success', false, 'error', 'Kurtarma görevleri tamamlanmadan XP verilemez.');
    END IF;

    -- 4. Apply updates
    UPDATE public.rescue_sessions
    SET status = 'completed', xp_awarded = true
    WHERE id = p_session_id;

    v_new_xp := COALESCE(v_profile.total_xp, 0) + p_xp_to_award;
    v_new_level := 1;
    IF v_new_xp >= 15000 THEN v_new_level := 4;
    ELSIF v_new_xp >= 5000 THEN v_new_level := 3;
    ELSIF v_new_xp >= 1000 THEN v_new_level := 2;
    END IF;

    UPDATE public.profiles
    SET total_xp = v_new_xp, broker_level = v_new_level
    WHERE id = p_user_id;

    -- Update or Insert user_stats
    INSERT INTO public.user_stats (
        user_id,
        date,
        xp_earned,
        tasks_completed,
        calls_made,
        visits_made,
        created_at,
        updated_at
    )
    VALUES (
        p_user_id,
        p_today,
        p_xp_to_award,
        1,
        0,
        0,
        p_now,
        p_now
    )
    ON CONFLICT (user_id, date)
    DO UPDATE SET
        xp_earned = COALESCE(public.user_stats.xp_earned, 0) + EXCLUDED.xp_earned,
        tasks_completed = COALESCE(public.user_stats.tasks_completed, 0) + EXCLUDED.tasks_completed,
        updated_at = EXCLUDED.updated_at;

    RETURN jsonb_build_object('success', true, 'xp_awarded', p_xp_to_award, 'new_total', v_new_xp);
END;
$$;

REVOKE ALL ON FUNCTION public.award_rescue_session_bonus(UUID, UUID, DATE, TIMESTAMPTZ, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.award_rescue_session_bonus(UUID, UUID, DATE, TIMESTAMPTZ, INT) FROM anon;
REVOKE ALL ON FUNCTION public.award_rescue_session_bonus(UUID, UUID, DATE, TIMESTAMPTZ, INT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.award_rescue_session_bonus(UUID, UUID, DATE, TIMESTAMPTZ, INT) TO service_role;
