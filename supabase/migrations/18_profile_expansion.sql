ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expertise_areas TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS working_style TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_start_time TEXT DEFAULT '09:00';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_coach_tone TEXT DEFAULT 'net';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preference TEXT DEFAULT 'normal';

NOTIFY pgrst, 'reload schema';
