-- 01_schema.sql: Canonical Schema Definition
-- This script is idempotent and handles both fresh installs and upgrades.

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Pre-cleanup for problematic columns
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE IF EXISTS subscription_state ALTER COLUMN "user_id" DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        ALTER TABLE IF EXISTS subscription_state DROP COLUMN IF EXISTS "user_id" CASCADE;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;

-- 2. Helper for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    IF (to_jsonb(NEW) ? 'updated_at') THEN
        NEW.updated_at = NOW();
    ELSIF (to_jsonb(NEW) ? 'updatedAt') THEN
        NEW."updatedAt" = NOW();
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Tables Definition
-- We use CREATE TABLE IF NOT EXISTS for all tables.
-- Column additions and renames are handled in the DO blocks below.

CREATE TABLE IF NOT EXISTS profiles (
    uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    email TEXT UNIQUE,
    role TEXT DEFAULT 'agent' CHECK (role IN ('agent', 'admin')),
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'elite', 'master')),
    total_xp INTEGER DEFAULT 0,
    broker_level INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    streak_freeze_count INTEGER DEFAULT 0,
    last_active_date DATE,
    last_ritual_completed_at TIMESTAMPTZ,
    last_day_started_at TIMESTAMPTZ,
    has_seen_onboarding BOOLEAN DEFAULT FALSE,
    has_seen_tour BOOLEAN DEFAULT FALSE,
    subscription_type TEXT DEFAULT 'none',
    subscription_end_date TIMESTAMPTZ,
    active_modules TEXT[] DEFAULT '{}',
    region JSONB,
    notification_settings JSONB DEFAULT '{"push": true, "email": false, "time": "09:00"}'::JSONB,
    last_morning_ritual_xp_at TIMESTAMPTZ,
    last_evening_ritual_xp_at TIMESTAMPTZ,
    last_end_day_xp_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT CHECK (type IN ('Arama', 'Randevu', 'Saha', 'Diğer')),
    category TEXT DEFAULT 'main' CHECK (category IN ('main', 'smart', 'sweet')),
    time TIMESTAMPTZ,
    completed BOOLEAN DEFAULT FALSE,
    points INTEGER DEFAULT 10,
    ai_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    points_earned INTEGER NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    type TEXT DEFAULT 'Alıcı' CHECK (type IN ('Alıcı', 'Satıcı', 'Kiracı', 'Yatırımcı', 'Diğer')),
    status TEXT DEFAULT 'Aday' CHECK (status IN ('Aday', 'Sıcak', 'Yetki Alındı', 'Pasif')),
    district TEXT,
    notes TEXT,
    last_contact TIMESTAMPTZ,
    behavior_metrics JSONB DEFAULT '{"totalViews": 0, "isHot": false}'::JSONB,
    xp_awarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT CHECK (category IN ('Satılık', 'Kiralık')),
    price NUMERIC(15, 2) NOT NULL,
    commission_rate NUMERIC(4, 2) DEFAULT 2.0,
    status TEXT DEFAULT 'Yeni' CHECK (status IN ('Yeni', 'Hazırlanıyor', 'Yayında', 'İlgi Var', 'Pazarlık', 'Satıldı', 'Pasif')),
    address JSONB NOT NULL,
    sale_probability NUMERIC(3, 2) DEFAULT 0.5,
    health_score NUMERIC DEFAULT 70,
    market_analysis JSONB DEFAULT '{}'::JSONB,
    images TEXT[] DEFAULT '{}',
    notes TEXT,
    target_customer_type TEXT,
    investment_suitability TEXT,
    owner JSONB DEFAULT '{}'::JSONB,
    details JSONB DEFAULT '{}'::JSONB,
    xp_awarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_briefings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    type TEXT CHECK (type IN ('morning', 'evening')),
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('coaching', 'rescue', 'alert', 'opportunity')),
    title TEXT,
    description TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_imports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    raw_text TEXT NOT NULL,
    analysis_result JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS performance_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    metrics JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    tier TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gamified_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    title TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    category TEXT CHECK (category IN ('main', 'smart', 'sweet')),
    is_completed BOOLEAN DEFAULT FALSE,
    date DATE DEFAULT CURRENT_DATE,
    ai_reason TEXT,
    reminder_time TEXT,
    notified BOOLEAN DEFAULT FALSE,
    xp_awarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    label TEXT NOT NULL,
    color TEXT NOT NULL,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    tasks_completed INTEGER DEFAULT 0,
    potential_revenue_handled NUMERIC DEFAULT 0,
    calls_made INTEGER DEFAULT 0,
    visits_made INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    day_started_at TIMESTAMPTZ,
    day_ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rescue_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    tasks JSONB DEFAULT '[]'::JSONB,
    date DATE DEFAULT CURRENT_DATE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    xp_awarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS field_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    title TEXT NOT NULL,
    address TEXT,
    last_visit TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS map_pins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    title TEXT NOT NULL,
    lat NUMERIC(10, 7) NOT NULL,
    lng NUMERIC(10, 7) NOT NULL,
    type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personal_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    due_date TIMESTAMPTZ,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
    reminder_time TEXT,
    notified BOOLEAN DEFAULT FALSE,
    xp_awarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS global_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    app_name TEXT DEFAULT 'Portfy',
    theme_color TEXT DEFAULT '#FF3D00',
    maintenance_mode BOOLEAN DEFAULT FALSE,
    global_modules JSONB DEFAULT '{"crm": true, "tasks": true, "map": true, "ai": true, "gamification": true}'::JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS broker_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    store_name TEXT NOT NULL,
    api_key TEXT NOT NULL,
    connected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    ext_id TEXT NOT NULL,
    title TEXT,
    price BIGINT,
    status TEXT,
    url TEXT,
    district TEXT,
    last_sync TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agent_id, ext_id)
);

CREATE TABLE IF NOT EXISTS property_sync_links (
    property_id UUID PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,
    external_listing_id UUID NOT NULL REFERENCES external_listings(id) ON DELETE CASCADE
);

-- 4. Column Parity and Renames
DO $$ 
DECLARE
    t text;
BEGIN 
    -- Profiles renames and additions
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='id' AND table_schema='public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='uid' AND table_schema='public') THEN
            ALTER TABLE profiles RENAME COLUMN id TO uid;
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'agent' CHECK (role IN ('agent', 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='active_modules') THEN
        ALTER TABLE profiles ADD COLUMN active_modules TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='region') THEN
        ALTER TABLE profiles ADD COLUMN region JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_ritual_completed_at') THEN
        ALTER TABLE profiles ADD COLUMN last_ritual_completed_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_day_started_at') THEN
        ALTER TABLE profiles ADD COLUMN last_day_started_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_morning_ritual_xp_at') THEN
        ALTER TABLE profiles ADD COLUMN last_morning_ritual_xp_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_evening_ritual_xp_at') THEN
        ALTER TABLE profiles ADD COLUMN last_evening_ritual_xp_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_end_day_xp_at') THEN
        ALTER TABLE profiles ADD COLUMN last_end_day_xp_at TIMESTAMPTZ;
    END IF;

    -- Generic agent_id rename and addition for all tables
    FOR t IN SELECT unnest(ARRAY[
        'tasks', 'task_completions', 'leads', 'properties', 
        'daily_briefings', 'ai_insights', 'whatsapp_imports', 
        'performance_snapshots', 'subscription_state', 'gamified_tasks', 
        'categories', 'user_stats', 'rescue_sessions', 'field_visits', 
        'map_pins', 'notes', 'personal_tasks', 'message_templates', 
        'broker_accounts', 'external_listings'
    ])
    LOOP
        -- Rename agentId/userId/user_id to agent_id if they exist
        -- We try to find any variant and rename it to agent_id
        
        -- agentId
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'agentId' AND table_schema = 'public') THEN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'agent_id' AND table_schema = 'public') THEN
                EXECUTE format('ALTER TABLE %I RENAME COLUMN "agentId" TO agent_id', t);
            ELSE
                BEGIN
                    EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS "agentId" CASCADE', t);
                EXCEPTION WHEN OTHERS THEN NULL;
                END;
            END IF;
        END IF;

        -- userId
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'userId' AND table_schema = 'public') THEN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'agent_id' AND table_schema = 'public') THEN
                EXECUTE format('ALTER TABLE %I RENAME COLUMN "userId" TO agent_id', t);
            ELSE
                BEGIN
                    EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS "userId" CASCADE', t);
                EXCEPTION WHEN OTHERS THEN NULL;
                END;
            END IF;
        END IF;

        -- user_id
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'user_id' AND table_schema = 'public') THEN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'agent_id' AND table_schema = 'public') THEN
                EXECUTE format('ALTER TABLE %I RENAME COLUMN "user_id" TO agent_id', t);
            ELSE
                BEGIN
                    EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS "user_id" CASCADE', t);
                EXCEPTION WHEN OTHERS THEN NULL;
                END;
            END IF;
        END IF;

        -- Add agent_id if it still doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'agent_id' AND table_schema = 'public') THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN agent_id UUID REFERENCES profiles(uid) ON DELETE CASCADE', t);
        END IF;
    END LOOP;

    -- Personal Tasks is_completed fix
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='personal_tasks' AND column_name='isCompleted') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='personal_tasks' AND column_name='is_completed') THEN
            ALTER TABLE personal_tasks RENAME COLUMN "isCompleted" TO is_completed;
        ELSE
            ALTER TABLE personal_tasks DROP COLUMN "isCompleted";
        END IF;
    END IF;

    -- Gamified Tasks parity
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamified_tasks' AND column_name='isCompleted') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamified_tasks' AND column_name='is_completed') THEN
            ALTER TABLE gamified_tasks RENAME COLUMN "isCompleted" TO is_completed;
        ELSE
            ALTER TABLE gamified_tasks DROP COLUMN "isCompleted";
        END IF;
    END IF;

    -- User Stats parity
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_stats' AND column_name='day_started_at') THEN
        ALTER TABLE user_stats ADD COLUMN day_started_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_stats' AND column_name='day_ended_at') THEN
        ALTER TABLE user_stats ADD COLUMN day_ended_at TIMESTAMPTZ;
    END IF;

    -- Properties parity
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='health_score') THEN
        ALTER TABLE properties ADD COLUMN health_score NUMERIC DEFAULT 70;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='market_analysis') THEN
        ALTER TABLE properties ADD COLUMN market_analysis JSONB DEFAULT '{}'::JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='images') THEN
        ALTER TABLE properties ADD COLUMN images TEXT[] DEFAULT '{}';
    END IF;

    -- XP Awarded parity
    FOR t IN SELECT unnest(ARRAY['leads', 'properties', 'rescue_sessions', 'personal_tasks', 'gamified_tasks'])
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'xp_awarded') THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN xp_awarded BOOLEAN DEFAULT FALSE', t);
        END IF;
    END LOOP;

END $$;

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_agent_date ON tasks(agent_id, time);
CREATE INDEX IF NOT EXISTS idx_leads_agent_status ON leads(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_properties_agent_status ON properties(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_gamified_tasks_agent_date ON gamified_tasks(agent_id, date);
CREATE INDEX IF NOT EXISTS idx_user_stats_agent_date ON user_stats(agent_id, date);
CREATE INDEX IF NOT EXISTS idx_message_templates_agent ON message_templates(agent_id);
CREATE INDEX IF NOT EXISTS idx_broker_accounts_agent ON broker_accounts(agent_id);
CREATE INDEX IF NOT EXISTS idx_external_listings_agent ON external_listings(agent_id);
CREATE INDEX IF NOT EXISTS idx_external_listings_ext_id ON external_listings(ext_id);
CREATE INDEX IF NOT EXISTS idx_rescue_sessions_date ON rescue_sessions(agent_id, date);
