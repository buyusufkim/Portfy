-- 06_missing_tables.sql
-- Additive migration to ensure schema consistency without dropping existing data.

-- 1. Profiles: Add ai_tokens_used field if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='ai_tokens_used') THEN
        ALTER TABLE profiles ADD COLUMN ai_tokens_used INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. subscription_packages: Additive table creation and column verification
CREATE TABLE IF NOT EXISTS subscription_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price_numeric NUMERIC NOT NULL DEFAULT 0,
    price_text TEXT NOT NULL DEFAULT '0₺',
    duration_months INTEGER NOT NULL DEFAULT 1,
    interval TEXT DEFAULT 'monthly',
    tier TEXT DEFAULT 'pro',
    is_active BOOLEAN DEFAULT TRUE,
    features JSONB DEFAULT '[]'::JSONB,
    badge TEXT,
    description TEXT,
    stripe_price_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure correct columns exist in subscription_packages if table was created previously with different schema
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscription_packages' AND column_name='price_numeric') THEN
        ALTER TABLE subscription_packages ADD COLUMN price_numeric NUMERIC NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscription_packages' AND column_name='price_text') THEN
        ALTER TABLE subscription_packages ADD COLUMN price_text TEXT NOT NULL DEFAULT '0₺';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscription_packages' AND column_name='tier') THEN
        ALTER TABLE subscription_packages ADD COLUMN tier TEXT DEFAULT 'pro';
    END IF;
END $$;

-- 3. user_usage_limits: Renamed from agent_id to user_id previously, ensuring consistency
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
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    points INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    auto_verify BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. system_settings
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    description TEXT,
    whatsapp_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable RLS (Safe to run multiple times)
ALTER TABLE subscription_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies: Drop and recreate to ensure latest logic
DROP POLICY IF EXISTS "Anyone can view active packages" ON subscription_packages;
CREATE POLICY "Anyone can view active packages" ON subscription_packages FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage packages" ON subscription_packages;
CREATE POLICY "Admins can manage packages" ON subscription_packages FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE uid = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can view own limits" ON user_usage_limits;
CREATE POLICY "Users can view own limits" ON user_usage_limits FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view templates" ON task_templates;
CREATE POLICY "Anyone can view templates" ON task_templates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view settings" ON system_settings;
CREATE POLICY "Anyone can view settings" ON system_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage settings" ON system_settings;
CREATE POLICY "Admins can manage settings" ON system_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE uid = auth.uid() AND role = 'admin')
);

-- 8. Updated At Triggers (Additive)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscription_packages_modtime') THEN
        CREATE TRIGGER update_subscription_packages_modtime BEFORE UPDATE ON subscription_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_usage_limits_modtime') THEN
        CREATE TRIGGER update_user_usage_limits_modtime BEFORE UPDATE ON user_usage_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_task_templates_modtime') THEN
        CREATE TRIGGER update_task_templates_modtime BEFORE UPDATE ON task_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_system_settings_modtime') THEN
        CREATE TRIGGER update_system_settings_modtime BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
