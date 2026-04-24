-- Patch migration to fix schema mismatches for production

-- 1. Add missing columns to territory_plans
ALTER TABLE territory_plans ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE territory_plans ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0;
ALTER TABLE territory_plans ADD COLUMN IF NOT EXISTS visit_target INTEGER DEFAULT 0;
ALTER TABLE territory_plans ADD COLUMN IF NOT EXISTS week_start_date DATE;

-- 2. Add missing columns to content_calendar
ALTER TABLE content_calendar ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE SET NULL;
ALTER TABLE content_calendar ADD COLUMN IF NOT EXISTS channel TEXT;

