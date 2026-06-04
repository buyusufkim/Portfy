-- 58_rescue_xp_idempotency.sql

-- Ensure that RESCUE_SESSION_BONUS can only be awarded once per rescue session (entity_id) per user.
DO $$
BEGIN
    IF to_regclass('public.user_activity_log') IS NOT NULL THEN
        CREATE UNIQUE INDEX IF NOT EXISTS user_activity_log_unique_rescue_bonus
        ON public.user_activity_log (user_id, action_type, entity_id)
        WHERE action_type = 'RESCUE_SESSION_BONUS' AND entity_id IS NOT NULL;
    END IF;
END $$;
