-- Migration: Add RegionRecordKind and related fields to categories table

-- Add 'kind' column to distinguish between network_contact and region_point.
-- Default is 'network_contact' to preserve existing data semantics.
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS kind text DEFAULT 'network_contact' CHECK (kind IN ('network_contact', 'region_point'));

-- Add 'is_default' to track if it's a system default category overridden by user.
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;

-- Add 'auto_add_to_crm' flag.
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS auto_add_to_crm boolean DEFAULT false;

-- Update existing default logic if needed
-- We can map existing categories to 'network_contact'
UPDATE public.categories
SET kind = 'network_contact'
WHERE kind IS NULL;
