-- Momentum OS Özellikleri İçin Schema Güncellemeleri
-- İlgili plan: docs/momentum_os_plan.md

-- 1. Akıllı İçerik Takvimi
CREATE TABLE IF NOT EXISTS content_calendar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    platform TEXT, -- Instagram, LinkedIn vs.
    status TEXT DEFAULT 'Taslak', -- Taslak, Planlandı, Yayınlandı
    scheduled_for TIMESTAMPTZ,
    content_text TEXT,
    media_urls TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Mikro Hedef Sistemi
CREATE TABLE IF NOT EXISTS micro_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_metric TEXT NOT NULL, -- örn: 'arama', 'ziyaret'
    target_value INTEGER NOT NULL,
    current_value INTEGER DEFAULT 0,
    deadline TIMESTAMPTZ,
    status TEXT DEFAULT 'Devam Ediyor',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Territory Planning
CREATE TABLE IF NOT EXISTS territory_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    boundaries JSONB, -- GeoJSON veya poligon koordinatları
    strategy_notes TEXT,
    status TEXT DEFAULT 'Aktif',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Referral Engine
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    referrer_name TEXT NOT NULL,
    referred_name TEXT NOT NULL,
    contact_info TEXT,
    status TEXT DEFAULT 'Bekliyor', -- Bekliyor, Görüşüldü, İşleme Döndü
    reward_status TEXT DEFAULT 'Verilmedi',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. İlk 7 Gün Aktivasyon Programı
CREATE TABLE IF NOT EXISTS user_activations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    completed_steps JSONB DEFAULT '[]'::JSONB,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Sahip Portalı Trafik Motoru
CREATE TABLE IF NOT EXISTS portal_traffic_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- İlanın sahibi
    viewer_ip TEXT,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    action TEXT DEFAULT 'Görüntüleme'
);

-- 7. Gün Sonu Kapanış ve Sabah Planı
CREATE TABLE IF NOT EXISTS daily_rituals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    ritual_date DATE NOT NULL DEFAULT CURRENT_DATE,
    morning_plan_completed_at TIMESTAMPTZ,
    morning_notes TEXT,
    evening_closing_completed_at TIMESTAMPTZ,
    evening_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, ritual_date)
);

-- 8. Haftalık İş Sonucu Panosu
CREATE TABLE IF NOT EXISTS weekly_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    metrics JSONB DEFAULT '{}'::JSONB,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, week_start_date)
);

-- 9. Kolon Eklemeleri (Geriye Dönük Uyumluluk)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS unsold_reason TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS requires_call BOOLEAN DEFAULT false;

-- Güvenlik Politikaları (RLS) - Basitleştirilmiş style
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own content_calendar" ON content_calendar;
CREATE POLICY "Users can manage their own content_calendar" ON content_calendar FOR ALL USING (auth.uid() = user_id);

ALTER TABLE micro_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own micro_goals" ON micro_goals;
CREATE POLICY "Users can manage their own micro_goals" ON micro_goals FOR ALL USING (auth.uid() = user_id);

ALTER TABLE territory_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own territory_plans" ON territory_plans;
CREATE POLICY "Users can manage their own territory_plans" ON territory_plans FOR ALL USING (auth.uid() = user_id);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own referrals" ON referrals;
CREATE POLICY "Users can manage their own referrals" ON referrals FOR ALL USING (auth.uid() = user_id);

ALTER TABLE user_activations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own user_activations" ON user_activations;
CREATE POLICY "Users can manage their own user_activations" ON user_activations FOR ALL USING (auth.uid() = user_id);

ALTER TABLE portal_traffic_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read their own portal_traffic_logs" ON portal_traffic_logs;
CREATE POLICY "Users can read their own portal_traffic_logs" ON portal_traffic_logs FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE daily_rituals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own daily_rituals" ON daily_rituals;
CREATE POLICY "Users can manage their own daily_rituals" ON daily_rituals FOR ALL USING (auth.uid() = user_id);

ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own weekly_reports" ON weekly_reports;
CREATE POLICY "Users can manage their own weekly_reports" ON weekly_reports FOR ALL USING (auth.uid() = user_id);
