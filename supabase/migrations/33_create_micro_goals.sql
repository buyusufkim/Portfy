create table if not exists public.micro_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  status text not null default 'pending',
  deadline timestamptz,
  target_metric text not null default 'daily_focus',
  target_value integer not null default 1,
  current_value integer not null default 0,
  xp_awarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.micro_goals
  add column if not exists xp_awarded boolean not null default false,
  alter column status set default 'pending',
  alter column target_metric set default 'daily_focus',
  alter column target_value set default 1;

update public.micro_goals set status = 'pending' where status = 'Devam Ediyor';
update public.micro_goals set status = 'completed' where status = 'Tamamlandı';
update public.micro_goals set status = 'cancelled' where status = 'İptal';

alter table public.micro_goals drop constraint if exists micro_goals_status_check;
alter table public.micro_goals add constraint micro_goals_status_check check (status in ('pending', 'completed', 'cancelled'));

drop policy if exists "Users can manage their own micro_goals" on public.micro_goals;
alter table public.micro_goals enable row level security;

create policy "Users can manage their own micro_goals" on public.micro_goals 
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_micro_goals_user_id on public.micro_goals (user_id);
create index if not exists idx_micro_goals_user_deadline on public.micro_goals (user_id, deadline);
create index if not exists idx_micro_goals_user_metric on public.micro_goals (user_id, target_metric);
create unique index if not exists idx_micro_goals_daily_target 
  on public.micro_goals (user_id, target_metric, ((deadline at time zone 'Europe/Istanbul')::date));

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS micro_goals_updated_at_trigger ON public.micro_goals;
CREATE TRIGGER micro_goals_updated_at_trigger
    BEFORE UPDATE ON public.micro_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

NOTIFY pgrst, 'reload schema';
