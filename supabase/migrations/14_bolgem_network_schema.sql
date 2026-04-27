-- Migration to support Bolgem Network features without breaking existing functionality
-- Safe ADD COLUMN IF NOT EXISTS structure to prevent migration errors

-- 1. Extend map_pins table
ALTER TABLE map_pins ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE map_pins ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE map_pins ADD COLUMN IF NOT EXISTS kind TEXT DEFAULT 'network_contact' CHECK (kind IN ('network_contact', 'region_point'));
ALTER TABLE map_pins ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE map_pins ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE map_pins ADD COLUMN IF NOT EXISTS relationship_level TEXT;
ALTER TABLE map_pins ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMPTZ;
ALTER TABLE map_pins ADD COLUMN IF NOT EXISTS next_contact_date TIMESTAMPTZ;
ALTER TABLE map_pins ADD COLUMN IF NOT EXISTS followup_date TIMESTAMPTZ;
ALTER TABLE map_pins ADD COLUMN IF NOT EXISTS potential TEXT;
ALTER TABLE map_pins ADD COLUMN IF NOT EXISTS add_to_crm BOOLEAN DEFAULT false;
ALTER TABLE map_pins ADD COLUMN IF NOT EXISTS crm_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE map_pins ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Extend tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Extend categories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS kind TEXT DEFAULT 'network_contact' CHECK (kind IN ('network_contact', 'region_point'));
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS auto_add_to_crm BOOLEAN DEFAULT false;

UPDATE public.categories SET kind = 'network_contact' WHERE kind IS NULL;
