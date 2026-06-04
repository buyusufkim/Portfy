-- 60_lock_legacy_award_xp_rpc.sql

-- Lock the legacy generic award_xp RPC to prevent direct client access
-- It should only be called server-side via service_role

REVOKE ALL ON FUNCTION public.award_xp(UUID, TEXT, UUID, DATE, TIMESTAMPTZ, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.award_xp(UUID, TEXT, UUID, DATE, TIMESTAMPTZ, JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.award_xp(UUID, TEXT, UUID, DATE, TIMESTAMPTZ, JSONB) FROM authenticated;

-- Ensure service_role can still call it
GRANT EXECUTE ON FUNCTION public.award_xp(UUID, TEXT, UUID, DATE, TIMESTAMPTZ, JSONB) TO service_role;
