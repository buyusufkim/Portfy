-- 02_security.sql: Canonical Security Definition
-- This script enables RLS, creates policies, and sets up security triggers.

-- 1. Enable RLS on all tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- 2. Helper Functions
-- Security Definer to avoid recursion when checking roles
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Global Policies
-- We drop existing policies to ensure a clean state
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- PROFILES Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (is_admin());

-- GLOBAL_SETTINGS Policies
CREATE POLICY "Anyone can view global settings" ON global_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update global settings" ON global_settings FOR UPDATE USING (is_admin());

-- Generic Agent-Scoped Policies
-- This covers most tables where agent_id must match auth.uid()
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN VALUES 
        ('tasks'), ('task_completions'), ('leads'), ('properties'), 
        ('daily_briefings'), ('ai_insights'), ('whatsapp_imports'), 
        ('performance_snapshots'), ('gamified_tasks'), 
        ('categories'), ('user_stats'), ('rescue_sessions'), ('field_visits'), 
        ('map_pins'), ('notes'), ('personal_tasks'), ('message_templates'), 
        ('broker_accounts'), ('external_listings')
    LOOP
        EXECUTE format('CREATE POLICY "Users can manage own %s" ON %I FOR ALL USING (user_id = auth.uid())', t, t);
    END LOOP;

    -- Special case for subscription_state: Users can only SELECT their own state.
    -- Writes are handled by the backend (service_role) via RPC.
    CREATE POLICY "Users can view own subscription state" ON subscription_state FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Admins can view all subscription states" ON subscription_state FOR SELECT USING (is_admin());
END $$;

-- PROPERTY_SYNC_LINKS Policy (Special case)
CREATE POLICY "Users can manage own property sync links" ON property_sync_links 
FOR ALL USING (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = property_sync_links.property_id AND properties.user_id = auth.uid())
);

-- 4. Triggers for updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'updated_at') THEN
            EXECUTE format('DROP TRIGGER IF EXISTS update_%I_modtime ON %I', t, t);
            EXECUTE format('CREATE TRIGGER update_%I_modtime BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
        END IF;
    END LOOP;
END $$;

-- 5. Field-Level Protection Trigger (Lockdown)
CREATE OR REPLACE FUNCTION protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow changes if requester is admin OR if it's the service_role (backend)
    IF is_admin() OR current_setting('role', true) = 'service_role' THEN
        RETURN NEW;
    END IF;

    -- Prevent changes to protected fields for normal users
    NEW.role = OLD.role;
    NEW.tier = OLD.tier;
    NEW.subscription_type = OLD.subscription_type;
    NEW.subscription_end_date = OLD.subscription_end_date;
    NEW.total_xp = OLD.total_xp;
    NEW.broker_level = OLD.broker_level;
    NEW.current_streak = OLD.current_streak;
    NEW.longest_streak = OLD.longest_streak;
    NEW.last_active_date = OLD.last_active_date;
    NEW.last_ritual_completed_at = OLD.last_ritual_completed_at;
    NEW.last_day_started_at = OLD.last_day_started_at;
    NEW.last_morning_ritual_xp_at = OLD.last_morning_ritual_xp_at;
    NEW.last_evening_ritual_xp_at = OLD.last_evening_ritual_xp_at;
    NEW.last_end_day_xp_at = OLD.last_end_day_xp_at;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Insert Protection Trigger
CREATE OR REPLACE FUNCTION handle_profile_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Force defaults for all new inserts unless it's the service_role
    IF current_setting('role', true) != 'service_role' THEN
        NEW.role := 'agent';
        NEW.tier := 'free';
        NEW.subscription_type := 'none';
        NEW.total_xp := 0;
        NEW.broker_level := 1;
        NEW.current_streak := 0;
        NEW.longest_streak := 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS ensure_profile_field_protection ON profiles;
CREATE TRIGGER ensure_profile_field_protection
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION protect_profile_fields();

DROP TRIGGER IF EXISTS ensure_profile_insert_protection ON profiles;
CREATE TRIGGER ensure_profile_insert_protection
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION handle_profile_insert();

-- 6. XP Award Protection for other tables
CREATE OR REPLACE FUNCTION protect_xp_awarded_field()
RETURNS TRIGGER AS $$
BEGIN
    IF is_admin() OR current_setting('role', true) = 'service_role' THEN
        RETURN NEW;
    END IF;

    NEW.xp_awarded = OLD.xp_awarded;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY['leads', 'properties', 'rescue_sessions', 'personal_tasks', 'gamified_tasks'])
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS ensure_xp_protection ON %I', t);
        EXECUTE format('CREATE TRIGGER ensure_xp_protection BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION protect_xp_awarded_field()', t);
    END LOOP;
END $$;
