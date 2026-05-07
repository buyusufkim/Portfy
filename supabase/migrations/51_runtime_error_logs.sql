CREATE TABLE IF NOT EXISTS public.runtime_error_logs (
    id uuid primary key default gen_random_uuid(),
    request_id text null,
    user_id uuid null references public.profiles(id) on delete set null,
    route text null,
    method text null,
    status_code integer null,
    error_code text null,
    message text not null,
    source text not null default 'server',
    severity text not null default 'error',
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

ALTER TABLE public.runtime_error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view runtime error logs"
ON public.runtime_error_logs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE public.profiles.id = auth.uid() 
        AND (public.profiles.tier = 'admin' OR public.profiles.tier = 'super_admin')
    )
);

CREATE INDEX IF NOT EXISTS idx_runtime_error_logs_created_at ON public.runtime_error_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtime_error_logs_source ON public.runtime_error_logs (source);
CREATE INDEX IF NOT EXISTS idx_runtime_error_logs_severity ON public.runtime_error_logs (severity);
CREATE INDEX IF NOT EXISTS idx_runtime_error_logs_status_code ON public.runtime_error_logs (status_code);
CREATE INDEX IF NOT EXISTS idx_runtime_error_logs_request_id ON public.runtime_error_logs (request_id);
CREATE INDEX IF NOT EXISTS idx_runtime_error_logs_user_id ON public.runtime_error_logs (user_id);
