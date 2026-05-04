-- 39_consolidated_repair.sql

-- 1. Ensure columns for already existing tables (from 07, 10, 19, 28)
-- subscription_packages
ALTER TABLE public.subscription_packages ADD COLUMN IF NOT EXISTS duration_months INTEGER;
ALTER TABLE public.subscription_packages ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE public.subscription_packages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- task_templates
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 10;
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS gpa_bucket TEXT;
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS recurrence_type TEXT DEFAULT 'once';
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS interval_days INTEGER;
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS recurrence_days INTEGER[] DEFAULT '{}';
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS day_of_month INTEGER;
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS target_scope TEXT DEFAULT 'all';
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS auto_generate BOOLEAN DEFAULT false;
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS action_type TEXT DEFAULT 'general';
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- system_settings
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS key TEXT;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS value JSONB;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- micro_goals
ALTER TABLE public.micro_goals ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.micro_goals ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;

-- gamified_tasks
ALTER TABLE public.gamified_tasks ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.task_templates(id) ON DELETE SET NULL;
ALTER TABLE public.gamified_tasks ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE public.gamified_tasks ADD COLUMN IF NOT EXISTS action_type TEXT DEFAULT 'general';
ALTER TABLE public.gamified_tasks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- properties and leads
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS unsold_reason TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;

-- 2. Create tables that might not exist yet (10, 12, 32)
CREATE TABLE IF NOT EXISTS public.content_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL,
    channel TEXT,
    status TEXT DEFAULT 'draft',
    scheduled_date TIMESTAMPTZ,
    published_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.territory_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    region TEXT NOT NULL,
    target_audience TEXT,
    strategy TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_by_name TEXT,
    referred_by_phone TEXT,
    lead_name TEXT NOT NULL,
    lead_phone TEXT,
    notes TEXT,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activation_type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    activated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.weekly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    summary TEXT,
    metrics JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- webhook_events (admin only)
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.increment_ai_tokens(p_user_id UUID, p_tokens INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET ai_tokens_used = COALESCE(ai_tokens_used, 0) + p_tokens,
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 5. RLS Policies
ALTER TABLE public.subscription_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.micro_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.territory_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Public reads
    DROP POLICY IF EXISTS "Public can view active subscription packages" ON public.subscription_packages;
    CREATE POLICY "Public can view active subscription packages" ON public.subscription_packages FOR SELECT USING (is_active = true);

    DROP POLICY IF EXISTS "Anyone can view templates" ON public.task_templates;
    CREATE POLICY "Anyone can view templates" ON public.task_templates FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Anyone can view system settings" ON public.system_settings;
    CREATE POLICY "Anyone can view system settings" ON public.system_settings FOR SELECT USING (true);

    -- User reads/writes (FOR ALL must have both USING and WITH CHECK)
    DROP POLICY IF EXISTS "Users can manage their content_calendar" ON public.content_calendar;
    CREATE POLICY "Users can manage their content_calendar" ON public.content_calendar FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can manage their micro_goals" ON public.micro_goals;
    CREATE POLICY "Users can manage their micro_goals" ON public.micro_goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can manage their territory_plans" ON public.territory_plans;
    CREATE POLICY "Users can manage their territory_plans" ON public.territory_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can manage their referrals" ON public.referrals;
    CREATE POLICY "Users can manage their referrals" ON public.referrals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can manage their user_activations" ON public.user_activations;
    CREATE POLICY "Users can manage their user_activations" ON public.user_activations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can manage their weekly_reports" ON public.weekly_reports;
    CREATE POLICY "Users can manage their weekly_reports" ON public.weekly_reports FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    
    -- Admin or internal webhook
    DROP POLICY IF EXISTS "Service role can manage webhook events" ON public.webhook_events;
    CREATE POLICY "Service role can manage webhook events" ON public.webhook_events AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);
END $$;

NOTIFY pgrst, 'reload schema';
