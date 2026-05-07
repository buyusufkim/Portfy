-- Migration 48: Feature Marketing Outputs
ALTER TABLE public.ai_request_logs
ADD COLUMN IF NOT EXISTS feature_key text;

ALTER TABLE public.ai_request_logs
ADD COLUMN IF NOT EXISTS request_id text;

ALTER TABLE public.ai_request_logs
ADD COLUMN IF NOT EXISTS status_code integer;

ALTER TABLE public.ai_request_logs
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.ai_request_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their ai request logs" ON public.ai_request_logs;
    CREATE POLICY "Users can view their ai request logs" 
    ON public.ai_request_logs 
    FOR SELECT 
    USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Admins can view all ai request logs" ON public.ai_request_logs;
    CREATE POLICY "Admins can view all ai request logs" 
    ON public.ai_request_logs 
    FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
      )
    );
END $$;
