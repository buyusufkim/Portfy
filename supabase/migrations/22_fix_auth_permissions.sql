-- Grant explicit permissions to supabase_auth_admin to prevent signup trigger errors
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON TABLE public.profiles TO supabase_auth_admin;

-- Set explicit ownership of the function to postgres to ensure it has correct permissions
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Ensure the service role also has access
GRANT ALL PRIVILEGES ON TABLE public.profiles TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.profiles TO postgres;

-- Overwrite the INSERT policy to explicitly allow the trigger to insert rows
-- even when auth.uid() is not yet established (during supabase_auth_admin executions)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles 
FOR INSERT 
WITH CHECK (
    auth.uid() = id 
    OR current_user = 'supabase_auth_admin' 
    OR current_setting('role', true) IN ('service_role', 'postgres', 'supabase_admin')
);
