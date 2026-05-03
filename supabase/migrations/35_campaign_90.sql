create table if not exists public.advisor_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
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

create table if not exists public.campaign_tasks (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.advisor_campaigns(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  day_number int not null,
  week_number int not null,
  task_key text not null,
  task_type text not null,
  title text not null,
  description text,
  gpa_bucket text check (gpa_bucket in ('G','P','A')),
  xp_reward int not null default 0,
  status text not null default 'pending' check (status in ('pending','completed','skipped')),
  due_date date not null,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.campaign_daily_scores (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.advisor_campaigns(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
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

alter table public.advisor_campaigns enable row level security;
alter table public.campaign_tasks enable row level security;
alter table public.campaign_daily_scores enable row level security;

create policy "Users can manage their advisor_campaigns" 
  on public.advisor_campaigns for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their campaign_tasks" 
  on public.campaign_tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their campaign_daily_scores" 
  on public.campaign_daily_scores for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Updated_at triggers (assuming update_updated_at_column exists or we can just redefine it inline if not sure, let's use the standard one usually created)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $func$ language 'plpgsql';
    END IF;
END
$$;

DROP TRIGGER IF EXISTS advisor_campaigns_updated_at_trigger ON public.advisor_campaigns;
CREATE TRIGGER advisor_campaigns_updated_at_trigger
    BEFORE UPDATE ON public.advisor_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS campaign_tasks_updated_at_trigger ON public.campaign_tasks;
CREATE TRIGGER campaign_tasks_updated_at_trigger
    BEFORE UPDATE ON public.campaign_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS campaign_daily_scores_updated_at_trigger ON public.campaign_daily_scores;
CREATE TRIGGER campaign_daily_scores_updated_at_trigger
    BEFORE UPDATE ON public.campaign_daily_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

NOTIFY pgrst, 'reload schema';
