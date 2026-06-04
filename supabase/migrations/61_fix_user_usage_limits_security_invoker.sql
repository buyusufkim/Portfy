-- 61_fix_user_usage_limits_security_invoker.sql
-- Fix for Supabase Security Advisor warning: View public.user_usage_limits acts like SECURITY DEFINER

DO $$
BEGIN
    -- Check if public.user_usage_limits exists and is actually a view (relkind = 'v')
    IF EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = 'user_usage_limits'
          AND c.relkind = 'v'
    ) THEN
        -- Configure the view to use the invoker's permissions
        EXECUTE 'ALTER VIEW public.user_usage_limits SET (security_invoker = true)';
        
        -- Revoke public, anon and authenticated access since it's not used by the frontend
        EXECUTE 'REVOKE ALL ON public.user_usage_limits FROM PUBLIC';
        EXECUTE 'REVOKE ALL ON public.user_usage_limits FROM anon';
        EXECUTE 'REVOKE ALL ON public.user_usage_limits FROM authenticated';
        
        -- The service_role automatically retains access due to superuser/bypassrls privileges
    END IF;
END $$;
