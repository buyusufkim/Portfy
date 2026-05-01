-- 19_recurring_gamified_tasks.sql
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS recurrence_type TEXT DEFAULT 'once';
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS interval_days INTEGER;
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS recurrence_days INTEGER[] DEFAULT '{}';
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS day_of_month INTEGER;
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS target_scope TEXT DEFAULT 'all';
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS auto_generate BOOLEAN DEFAULT false;
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS action_type TEXT DEFAULT 'general';

ALTER TABLE public.gamified_tasks ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.task_templates(id) ON DELETE SET NULL;
ALTER TABLE public.gamified_tasks ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'system';
ALTER TABLE public.gamified_tasks ADD COLUMN IF NOT EXISTS action_type TEXT DEFAULT 'general';

-- Add constraints for fields
ALTER TABLE public.task_templates DROP CONSTRAINT IF EXISTS chk_recurrence_type;
ALTER TABLE public.task_templates ADD CONSTRAINT chk_recurrence_type CHECK (recurrence_type IN ('once', 'daily', 'interval', 'weekly', 'monthly'));

ALTER TABLE public.task_templates DROP CONSTRAINT IF EXISTS chk_target_scope;
ALTER TABLE public.task_templates ADD CONSTRAINT chk_target_scope CHECK (target_scope IN ('all', 'free', 'trial', 'master'));

ALTER TABLE public.task_templates DROP CONSTRAINT IF EXISTS chk_action_type;
ALTER TABLE public.task_templates ADD CONSTRAINT chk_action_type CHECK (action_type IN ('general', 'content_story', 'content_reels', 'crm_visit', 'crm_call', 'property_check', 'bolgem_visit', 'daily_start', 'daily_close'));

ALTER TABLE public.task_templates DROP CONSTRAINT IF EXISTS chk_interval_days;
ALTER TABLE public.task_templates ADD CONSTRAINT chk_interval_days CHECK (recurrence_type != 'interval' OR interval_days >= 1);

-- Unique index
CREATE UNIQUE INDEX IF NOT EXISTS ux_gamified_tasks_user_date_template
ON public.gamified_tasks(user_id, date, template_id)
WHERE template_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
