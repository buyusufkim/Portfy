-- Portfy Production Database Schema (Aligned with Code)
-- Supabase PostgreSQL

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Trigger Function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if updated_at column exists in the record
    IF (to_jsonb(NEW) ? 'updated_at') THEN
        NEW.updated_at = NOW();
    ELSIF (to_jsonb(NEW) ? 'updatedAt') THEN
        NEW."updatedAt" = NOW();
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Fallback to returning NEW without modification if anything goes wrong
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Tables

-- PROFILES: User core data and gamification state
-- Note: Code expects 'uid' as the primary key column name
CREATE TABLE IF NOT EXISTS profiles (
    uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    email TEXT UNIQUE,
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'elite', 'master')),
    total_xp INTEGER DEFAULT 0,
    broker_level INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    streak_freeze_count INTEGER DEFAULT 0,
    last_active_date DATE,
    notification_settings JSONB DEFAULT '{"push": true, "email": false, "time": "09:00"}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was already created by Supabase default
DO $$ 
BEGIN 
    -- Handle case where primary key might be named 'id' instead of 'uid'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='id' AND table_schema='public') THEN
        -- Only rename if 'uid' doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='uid' AND table_schema='public') THEN
            ALTER TABLE profiles RENAME COLUMN id TO uid;
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='tier') THEN
        ALTER TABLE profiles ADD COLUMN tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'elite', 'master'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='total_xp') THEN
        ALTER TABLE profiles ADD COLUMN total_xp INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='broker_level') THEN
        ALTER TABLE profiles ADD COLUMN broker_level INTEGER DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='current_streak') THEN
        ALTER TABLE profiles ADD COLUMN current_streak INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='longest_streak') THEN
        ALTER TABLE profiles ADD COLUMN longest_streak INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='streak_freeze_count') THEN
        ALTER TABLE profiles ADD COLUMN streak_freeze_count INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_active_date') THEN
        ALTER TABLE profiles ADD COLUMN last_active_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='notification_settings') THEN
        ALTER TABLE profiles ADD COLUMN notification_settings JSONB DEFAULT '{"push": true, "email": false, "time": "09:00"}'::JSONB;
    END IF;
END $$;

-- TASKS: Daily and scheduled tasks
-- Note: Code expects 'agentId' as the foreign key column name
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "agentId" UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
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

-- TASK_COMPLETIONS: History for analytics and XP tracking
CREATE TABLE IF NOT EXISTS task_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    points_earned INTEGER NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEADS: Leads and customer management (Code uses 'leads' table)
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "agentId" UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    type TEXT DEFAULT 'Alıcı' CHECK (type IN ('Alıcı', 'Satıcı', 'Kiracı', 'Yatırımcı', 'Diğer')),
    status TEXT DEFAULT 'Aday' CHECK (status IN ('Aday', 'Sıcak', 'Yetki Alındı', 'Pasif')),
    district TEXT,
    notes TEXT,
    last_contact TIMESTAMPTZ,
    behavior_metrics JSONB DEFAULT '{"totalViews": 0, "isHot": false}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROPERTIES: Real estate portfolios
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "agentId" UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT CHECK (category IN ('Satılık', 'Kiralık')),
    price NUMERIC(15, 2) NOT NULL,
    commission_rate NUMERIC(4, 2) DEFAULT 2.0,
    status TEXT DEFAULT 'Yeni' CHECK (status IN ('Yeni', 'Hazırlanıyor', 'Yayında', 'İlgi Var', 'Pazarlık', 'Satıldı', 'Pasif')),
    address JSONB NOT NULL, -- {city, district, neighborhood, lat, lng}
    sale_probability NUMERIC(3, 2) DEFAULT 0.5,
    details JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DAILY_BRIEFINGS: AI generated morning/evening reports
CREATE TABLE IF NOT EXISTS daily_briefings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    type TEXT CHECK (type IN ('morning', 'evening')),
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI_INSIGHTS: Real-time coaching and alerts
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

-- WHATSAPP_IMPORTS: History of analyzed chats
CREATE TABLE IF NOT EXISTS whatsapp_imports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    raw_text TEXT NOT NULL,
    analysis_result JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PERFORMANCE_SNAPSHOTS: Historical performance data
CREATE TABLE IF NOT EXISTS performance_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    metrics JSONB NOT NULL, -- {revenue, tasks_completed, leads_gained, etc}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBSCRIPTION_STATE: Detailed billing and access state
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

-- GAMIFIED_TASKS: Daily gamified tasks for agents
CREATE TABLE IF NOT EXISTS gamified_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    title TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    category TEXT CHECK (category IN ('main', 'smart', 'sweet')),
    is_completed BOOLEAN DEFAULT FALSE,
    date DATE DEFAULT CURRENT_DATE,
    ai_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER_STATS: Daily performance metrics for agents
CREATE TABLE IF NOT EXISTS user_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    tasks_completed INTEGER DEFAULT 0,
    potential_revenue_handled NUMERIC DEFAULT 0,
    calls_made INTEGER DEFAULT 0,
    visits_made INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RESCUE_SESSIONS: AI-guided rescue sessions
CREATE TABLE IF NOT EXISTS rescue_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    tasks JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FIELD_VISITS: Log of physical property visits
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

-- MAP_PINS: Custom pins on the map
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

-- NOTES: User personal notes
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PERSONAL_TASKS: Non-gamified personal tasks
CREATE TABLE IF NOT EXISTS personal_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
    title TEXT NOT NULL,
    "isCompleted" BOOLEAN DEFAULT FALSE,
    due_date TIMESTAMPTZ,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_tasks_agent_date ON tasks("agentId", time);
CREATE INDEX IF NOT EXISTS idx_leads_agent_status ON leads("agentId", status);
CREATE INDEX IF NOT EXISTS idx_properties_agent_status ON properties("agentId", status);
CREATE INDEX IF NOT EXISTS idx_gamified_tasks_agent_date ON gamified_tasks(agent_id, date);
CREATE INDEX IF NOT EXISTS idx_user_stats_agent_date ON user_stats(agent_id, date);
CREATE INDEX IF NOT EXISTS idx_ai_insights_agent_unread ON ai_insights(agent_id) WHERE is_read = FALSE;

-- 5. Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_modtime ON profiles;
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_modtime ON tasks;
CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_modtime ON leads;
CREATE TRIGGER update_leads_modtime BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_modtime ON properties;
CREATE TRIGGER update_properties_modtime BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gamified_tasks_modtime ON gamified_tasks;
CREATE TRIGGER update_gamified_tasks_modtime BEFORE UPDATE ON gamified_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_stats_modtime ON user_stats;
CREATE TRIGGER update_user_stats_modtime BEFORE UPDATE ON user_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rescue_sessions_modtime ON rescue_sessions;
CREATE TRIGGER update_rescue_sessions_modtime BEFORE UPDATE ON rescue_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_field_visits_modtime ON field_visits;
CREATE TRIGGER update_field_visits_modtime BEFORE UPDATE ON field_visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_map_pins_modtime ON map_pins;
CREATE TRIGGER update_map_pins_modtime BEFORE UPDATE ON map_pins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notes_modtime ON notes;
CREATE TRIGGER update_notes_modtime BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_personal_tasks_modtime ON personal_tasks;
CREATE TRIGGER update_personal_tasks_modtime BEFORE UPDATE ON personal_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_completions_modtime ON task_completions;
CREATE TRIGGER update_task_completions_modtime BEFORE UPDATE ON task_completions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_briefings_modtime ON daily_briefings;
CREATE TRIGGER update_daily_briefings_modtime BEFORE UPDATE ON daily_briefings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_insights_modtime ON ai_insights;
CREATE TRIGGER update_ai_insights_modtime BEFORE UPDATE ON ai_insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_whatsapp_imports_modtime ON whatsapp_imports;
CREATE TRIGGER update_whatsapp_imports_modtime BEFORE UPDATE ON whatsapp_imports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_performance_snapshots_modtime ON performance_snapshots;
CREATE TRIGGER update_performance_snapshots_modtime BEFORE UPDATE ON performance_snapshots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Ensure updated_at exists on all tables and add snake_case columns if missing
DO $$ 
BEGIN 
    -- Profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='updated_at') THEN
        ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Tasks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='updated_at') THEN
        ALTER TABLE tasks ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='agent_id') THEN
        -- If agentId exists, rename it
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='agentId') THEN
            ALTER TABLE tasks RENAME COLUMN "agentId" TO agent_id;
        ELSE
            ALTER TABLE tasks ADD COLUMN agent_id UUID REFERENCES profiles(uid) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Leads
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='updated_at') THEN
        ALTER TABLE leads ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='agent_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='agentId') THEN
            ALTER TABLE leads RENAME COLUMN "agentId" TO agent_id;
        ELSE
            ALTER TABLE leads ADD COLUMN agent_id UUID REFERENCES profiles(uid) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Properties
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='updated_at') THEN
        ALTER TABLE properties ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='agent_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='agentId') THEN
            ALTER TABLE properties RENAME COLUMN "agentId" TO agent_id;
        ELSE
            ALTER TABLE properties ADD COLUMN agent_id UUID REFERENCES profiles(uid) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Gamified Tasks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamified_tasks' AND column_name='agent_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamified_tasks' AND column_name='agentId') THEN
            ALTER TABLE gamified_tasks RENAME COLUMN "agentId" TO agent_id;
        END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamified_tasks' AND column_name='is_completed') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamified_tasks' AND column_name='isCompleted') THEN
            ALTER TABLE gamified_tasks RENAME COLUMN "isCompleted" TO is_completed;
        END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamified_tasks' AND column_name='ai_reason') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamified_tasks' AND column_name='aiReason') THEN
            ALTER TABLE gamified_tasks RENAME COLUMN "aiReason" TO ai_reason;
        END IF;
    END IF;

    -- Ensure updated_at exists on all tables that have the trigger
    DO $$
    DECLARE
        t text;
    BEGIN
        FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        LOOP
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'updated_at') THEN
                BEGIN
                    EXECUTE format('ALTER TABLE %I ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW()', t);
                EXCEPTION WHEN OTHERS THEN
                    -- Ignore errors (e.g. if table is not owned by us)
                END;
            END IF;
        END LOOP;
    END $$;

    -- Personal Tasks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='personal_tasks' AND column_name='isCompleted') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='personal_tasks' AND column_name='completed') THEN
            ALTER TABLE personal_tasks RENAME COLUMN "completed" TO "isCompleted";
        ELSE
            ALTER TABLE personal_tasks ADD COLUMN "isCompleted" BOOLEAN DEFAULT FALSE;
        END IF;
    END IF;

    -- User Stats
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_stats' AND column_name='agent_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_stats' AND column_name='agentId') THEN
            ALTER TABLE user_stats RENAME COLUMN "agentId" TO agent_id;
        END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_stats' AND column_name='tasks_completed') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_stats' AND column_name='tasksCompleted') THEN
            ALTER TABLE user_stats RENAME COLUMN "tasksCompleted" TO tasks_completed;
        END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_stats' AND column_name='potential_revenue_handled') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_stats' AND column_name='potentialRevenueHandled') THEN
            ALTER TABLE user_stats RENAME COLUMN "potentialRevenueHandled" TO potential_revenue_handled;
        END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_stats' AND column_name='calls_made') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_stats' AND column_name='callsMade') THEN
            ALTER TABLE user_stats RENAME COLUMN "callsMade" TO calls_made;
        END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_stats' AND column_name='visits_made') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_stats' AND column_name='visitsMade') THEN
            ALTER TABLE user_stats RENAME COLUMN "visitsMade" TO visits_made;
        END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_stats' AND column_name='xp_earned') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_stats' AND column_name='xpEarned') THEN
            ALTER TABLE user_stats RENAME COLUMN "xpEarned" TO xp_earned;
        END IF;
    END IF;

END $$;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamified_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE rescue_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_tasks ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = uid);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = uid);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own tasks') THEN
        CREATE POLICY "Users can manage own tasks" ON tasks FOR ALL USING (auth.uid() = agent_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own leads') THEN
        CREATE POLICY "Users can manage own leads" ON leads FOR ALL USING (auth.uid() = agent_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own properties') THEN
        CREATE POLICY "Users can manage own properties" ON properties FOR ALL USING (auth.uid() = agent_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own gamified tasks') THEN
        CREATE POLICY "Users can manage own gamified tasks" ON gamified_tasks FOR ALL USING (auth.uid() = agent_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own stats') THEN
        CREATE POLICY "Users can manage own stats" ON user_stats FOR ALL USING (auth.uid() = agent_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own rescue sessions') THEN
        CREATE POLICY "Users can manage own rescue sessions" ON rescue_sessions FOR ALL USING (auth.uid() = agent_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own field visits') THEN
        CREATE POLICY "Users can manage own field visits" ON field_visits FOR ALL USING (auth.uid() = agent_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own map pins') THEN
        CREATE POLICY "Users can manage own map pins" ON map_pins FOR ALL USING (auth.uid() = agent_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own notes') THEN
        CREATE POLICY "Users can manage own notes" ON notes FOR ALL USING (auth.uid() = agent_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own personal tasks') THEN
        CREATE POLICY "Users can manage own personal tasks" ON personal_tasks FOR ALL USING (auth.uid() = agent_id);
    END IF;
END $$;
