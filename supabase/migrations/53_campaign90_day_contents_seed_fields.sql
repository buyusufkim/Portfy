-- Migration 53: Campaign 90 Day Contents Seed Fields
ALTER TABLE public.campaign90_day_contents ADD COLUMN IF NOT EXISTS week_number INT;
ALTER TABLE public.campaign90_day_contents ADD COLUMN IF NOT EXISTS phase_title TEXT;
ALTER TABLE public.campaign90_day_contents ADD COLUMN IF NOT EXISTS main_objective TEXT;
ALTER TABLE public.campaign90_day_contents ADD COLUMN IF NOT EXISTS module_title TEXT;
ALTER TABLE public.campaign90_day_contents ADD COLUMN IF NOT EXISTS learning_goals JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.campaign90_day_contents ADD COLUMN IF NOT EXISTS field_example TEXT;
ALTER TABLE public.campaign90_day_contents ADD COLUMN IF NOT EXISTS common_mistake TEXT;
ALTER TABLE public.campaign90_day_contents ADD COLUMN IF NOT EXISTS pro_tip TEXT;
ALTER TABLE public.campaign90_day_contents ADD COLUMN IF NOT EXISTS script_example TEXT;
ALTER TABLE public.campaign90_day_contents ADD COLUMN IF NOT EXISTS mini_quiz JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.campaign90_day_contents ADD COLUMN IF NOT EXISTS practice_assignment TEXT;
ALTER TABLE public.campaign90_day_contents ADD COLUMN IF NOT EXISTS glossary_terms JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.campaign90_day_contents ADD COLUMN IF NOT EXISTS homework JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.campaign90_day_contents ADD COLUMN IF NOT EXISTS task_items JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.campaign90_day_contents ADD COLUMN IF NOT EXISTS video_placeholder TEXT;
ALTER TABLE public.campaign90_day_contents ADD COLUMN IF NOT EXISTS seed_source TEXT;
ALTER TABLE public.campaign90_day_contents ADD COLUMN IF NOT EXISTS seeded_at TIMESTAMP WITH TIME ZONE;

NOTIFY pgrst, 'reload schema';
