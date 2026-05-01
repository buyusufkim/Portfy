-- src/supabase/migrations/20_notification_preferences.sql
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  in_app boolean not null default true,
  email boolean not null default false,
  push boolean not null default false,
  whatsapp boolean not null default false,
  frequency text not null default 'instant',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  constraint notification_preferences_type_check check (type in ('new_lead', 'price_revision', 'ai_recommendation', 'market_report', 'system_announcement')),
  constraint notification_preferences_freq_check check (frequency in ('instant', 'daily', 'weekly', 'never')),
  constraint notification_preferences_user_id_type_key unique (user_id, type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS notification_preferences_user_id_idx ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS notification_preferences_user_id_type_idx ON public.notification_preferences(user_id, type);

-- Updated_at trigger (using a safe approach if existing functions are not there)
CREATE OR REPLACE FUNCTION public.handle_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_notification_preferences_updated ON public.notification_preferences;
CREATE TRIGGER on_notification_preferences_updated
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.handle_notification_preferences_updated_at();

-- RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences"
ON public.notification_preferences FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
ON public.notification_preferences FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
ON public.notification_preferences FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notification preferences"
ON public.notification_preferences FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
