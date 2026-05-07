-- Migration 50: Package Requests
-- Create package_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.package_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    requested_package TEXT NOT NULL,
    requested_duration TEXT NOT NULL,
    amount_numeric INTEGER NOT NULL,
    amount_text TEXT NOT NULL,
    user_note TEXT,
    admin_note TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.package_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to make it idempotent
DROP POLICY IF EXISTS "Users can view their own package requests" ON public.package_requests;
DROP POLICY IF EXISTS "Users can create package requests" ON public.package_requests;
DROP POLICY IF EXISTS "Users can update their pending package requests" ON public.package_requests;
DROP POLICY IF EXISTS "Admins can view and manage all package requests" ON public.package_requests;

-- Policy: Users can view their own package requests
CREATE POLICY "Users can view their own package requests"
    ON public.package_requests
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can create package requests
CREATE POLICY "Users can create package requests"
    ON public.package_requests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Policy: Users can cancel their own pending package requests
CREATE POLICY "Users can cancel their pending package requests"
    ON public.package_requests
    FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending')
    WITH CHECK (status = 'cancelled' OR status = 'pending');

-- Policy: Admins can view and manage all package requests
CREATE POLICY "Admins can view and manage all package requests"
    ON public.package_requests
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );

-- Add updated_at trigger if doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'set_package_requests_updated_at'
    ) THEN
        CREATE TRIGGER set_package_requests_updated_at
            BEFORE UPDATE ON public.package_requests
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
