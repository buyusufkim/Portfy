ALTER TABLE public.personal_tasks ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.personal_tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;
