-- Add missing fields to tasks table for Activity and Drip Campaigns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='lead_id') THEN
        ALTER TABLE tasks ADD COLUMN lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='notes') THEN
        ALTER TABLE tasks ADD COLUMN notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='due_date') THEN
        ALTER TABLE tasks ADD COLUMN due_date TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='is_drip') THEN
        ALTER TABLE tasks ADD COLUMN is_drip BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='ai_suggestion') THEN
        ALTER TABLE tasks ADD COLUMN ai_suggestion TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='drip_type') THEN
        ALTER TABLE tasks ADD COLUMN drip_type TEXT;
    END IF;
END $$;

-- tasks tablosunu son sürüme (Drip Campaigns ve Portföy İlişkisi) güncelle
DO $$ 
BEGIN
    -- 1. Portföy ilişkisi sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='property_id') THEN
        ALTER TABLE tasks ADD COLUMN property_id UUID REFERENCES properties(id) ON DELETE SET NULL;
    END IF;

    -- 2. Müşteri ilişkisi sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='lead_id') THEN
        ALTER TABLE tasks ADD COLUMN lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;
    END IF;

    -- 3. Takip kampanyası (Drip) işaretleyicisi
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='is_drip') THEN
        ALTER TABLE tasks ADD COLUMN is_drip BOOLEAN DEFAULT FALSE;
    END IF;

    -- 4. Yapay zeka önerisi metni
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='ai_suggestion') THEN
        ALTER TABLE tasks ADD COLUMN ai_suggestion TEXT;
    END IF;

    -- 5. Ek notlar sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='notes') THEN
        ALTER TABLE tasks ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Şema önbelleğini yenile (Hata almamak için kritik)
NOTIFY pgrst, 'reload schema';