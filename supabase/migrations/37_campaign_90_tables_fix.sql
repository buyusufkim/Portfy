-- 37_campaign_90_tables_fix.sql

-- Ensure advisor_campaigns exists
CREATE TABLE IF NOT EXISTS public.advisor_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_type text not null default 'new_advisor_90',
  status text not null default 'active' check (status in ('active','paused','completed','cancelled')),
  start_date date not null,
  current_day int not null default 1,
  current_week int not null default 1,
  region text,
  niche text,
  daily_contact_target int not null default 20,
  weekly_contact_target int not null default 100,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure campaign_tasks exists
CREATE TABLE IF NOT EXISTS public.campaign_tasks (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.advisor_campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  day_number int not null,
  week_number int not null,
  task_key text not null,
  task_type text not null,
  title text not null,
  description text,
  gpa_bucket text check (gpa_bucket in ('G','P','A')),
  xp_reward int not null default 0,
  xp_awarded boolean not null default false,
  status text not null default 'pending' check (status in ('pending','completed','skipped')),
  due_date date not null,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure campaign_daily_scores exists
CREATE TABLE IF NOT EXISTS public.campaign_daily_scores (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.advisor_campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score_date date not null,
  g_score int not null default 0,
  p_score int not null default 0,
  a_score int not null default 0,
  total_score int not null default 0,
  completed_tasks int not null default 0,
  total_tasks int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, score_date)
);

-- Ensure work_discipline_logs exists to avoid PGRST205 errors
CREATE TABLE IF NOT EXISTS public.work_discipline_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date date NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    did_rituals boolean DEFAULT false,
    daily_score integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, log_date)
);

ALTER TABLE public.advisor_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_daily_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_discipline_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can manage their advisor_campaigns" ON public.advisor_campaigns;
    CREATE POLICY "Users can manage their advisor_campaigns" 
      ON public.advisor_campaigns FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can manage their campaign_tasks" ON public.campaign_tasks;
    CREATE POLICY "Users can manage their campaign_tasks" 
      ON public.campaign_tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can manage their campaign_daily_scores" ON public.campaign_daily_scores;
    CREATE POLICY "Users can manage their campaign_daily_scores" 
      ON public.campaign_daily_scores FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can manage their work_discipline_logs" ON public.work_discipline_logs;
    CREATE POLICY "Users can manage their work_discipline_logs"
      ON public.work_discipline_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
END $$;

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_tasks_unique_day 
ON campaign_tasks (campaign_id, user_id, task_key, due_date);

CREATE INDEX IF NOT EXISTS idx_campaign_scores_lookup 
ON campaign_daily_scores (campaign_id, user_id, score_date);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
