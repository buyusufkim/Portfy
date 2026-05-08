-- Migration 52: Campaign 90 Day Contents
CREATE TABLE IF NOT EXISTS public.campaign90_day_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_number INT NOT NULL UNIQUE CHECK (day_number BETWEEN 1 AND 90),
    title TEXT NOT NULL,
    short_summary TEXT,
    learning_content TEXT,
    mentor_message TEXT,
    vocabulary_title TEXT,
    vocabulary_content TEXT,
    task_brief TEXT,
    daily_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    video_title TEXT,
    video_url TEXT,
    video_duration_minutes INT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'inactive')),
    updated_by_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE public.campaign90_day_contents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct user access to day contents" ON public.campaign90_day_contents;
DROP POLICY IF EXISTS "Admins can manage day contents" ON public.campaign90_day_contents;

-- For now, no direct read access for users through this table (they read through a different mechanism or via edge functions).
CREATE POLICY "No direct user access to day contents"
    ON public.campaign90_day_contents
    FOR SELECT
    USING (false);

-- Only admins via service_role or a custom admin query
CREATE POLICY "Admins can manage day contents"
    ON public.campaign90_day_contents
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );

-- Keep updated_at fresh
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'set_campaign90_day_contents_updated_at'
    ) THEN
        CREATE TRIGGER set_campaign90_day_contents_updated_at
            BEFORE UPDATE ON public.campaign90_day_contents
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
