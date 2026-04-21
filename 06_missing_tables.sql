-- 06_missing_tables.sql
-- Missing tables and fields identified from src/types.ts and src/types/schema.ts

-- 1. Profiles: Add ai_tokens_used field
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='ai_tokens_used') THEN
        ALTER TABLE profiles ADD COLUMN ai_tokens_used INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. subscription_packages
CREATE TABLE IF NOT EXISTS subscription_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price NUMERIC(15, 2) NOT NULL,
    interval TEXT DEFAULT 'monthly',
    duration_months INTEGER DEFAULT 1,
    features TEXT[] DEFAULT '{}',
    stripe_price_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. user_usage_limits
CREATE TABLE IF NOT EXISTS user_usage_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    current_usage INTEGER DEFAULT 0,
    max_limit INTEGER NOT NULL,
    reset_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, feature_name)
);

-- 4. task_templates
CREATE TABLE IF NOT EXISTS task_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL CHECK (category IN ('listing', 'sale', 'prospecting', 'ritual')),
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. system_settings (Key-Value storage for global features)
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable RLS
ALTER TABLE subscription_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
-- Security helper is_admin() is assumed to exist from 02_security.sql

-- subscription_packages
DROP POLICY IF EXISTS "Anyone can view active packages" ON subscription_packages;
CREATE POLICY "Anyone can view active packages" ON subscription_packages FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage packages" ON subscription_packages;
CREATE POLICY "Admins can manage packages" ON subscription_packages FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE uid = auth.uid() AND role = 'admin')
);

-- user_usage_limits
DROP POLICY IF EXISTS "Users can view own limits" ON user_usage_limits;
CREATE POLICY "Users can view own limits" ON user_usage_limits FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all limits" ON user_usage_limits;
CREATE POLICY "Admins can manage all limits" ON user_usage_limits FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE uid = auth.uid() AND role = 'admin')
);

-- task_templates
DROP POLICY IF EXISTS "Anyone can view templates" ON task_templates;
CREATE POLICY "Anyone can view templates" ON task_templates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage templates" ON task_templates;
CREATE POLICY "Admins can manage templates" ON task_templates FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE uid = auth.uid() AND role = 'admin')
);

-- system_settings
DROP POLICY IF EXISTS "Anyone can view settings" ON system_settings;
CREATE POLICY "Anyone can view settings" ON system_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage settings" ON system_settings;
CREATE POLICY "Admins can manage settings" ON system_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE uid = auth.uid() AND role = 'admin')
);

-- 8. Updated At Triggers
-- Function update_updated_at_column() is assumed to exist from 01_schema.sql

DROP TRIGGER IF EXISTS update_subscription_packages_modtime ON subscription_packages;
CREATE TRIGGER update_subscription_packages_modtime BEFORE UPDATE ON subscription_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_usage_limits_modtime ON user_usage_limits;
CREATE TRIGGER update_user_usage_limits_modtime BEFORE UPDATE ON user_usage_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_templates_modtime ON task_templates;
CREATE TRIGGER update_task_templates_modtime BEFORE UPDATE ON task_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_settings_modtime ON system_settings;
CREATE TRIGGER update_system_settings_modtime BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Eksik olan system_settings, subscription_packages ve task_templates tablolarının UI ile tam uyumlu şeması

DROP TABLE IF EXISTS public.subscription_packages CASCADE;
CREATE TABLE public.subscription_packages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    price_numeric numeric NOT NULL DEFAULT 0,
    price_text text NOT NULL DEFAULT '0₺',
    duration_months integer NOT NULL DEFAULT 1,
    interval text DEFAULT 'monthly',
    tier text DEFAULT 'pro',
    is_active boolean DEFAULT true,
    features jsonb DEFAULT '[]'::jsonb,
    badge text,
    description text,
    stripe_price_id text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

DROP TABLE IF EXISTS public.system_settings CASCADE;
CREATE TABLE public.system_settings (
    id serial PRIMARY KEY,
    key text UNIQUE NOT NULL,
    value jsonb,
    description text,
    whatsapp_number text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

DROP TABLE IF EXISTS public.task_templates CASCADE;
CREATE TABLE public.task_templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    category text NOT NULL,
    title text NOT NULL,
    description text,
    priority text DEFAULT 'medium',
    points integer DEFAULT 10,
    is_active boolean DEFAULT true,
    auto_verify boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);