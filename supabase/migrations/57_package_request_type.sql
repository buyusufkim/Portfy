-- supabase/migrations/57_package_request_type.sql
ALTER TABLE package_requests ADD COLUMN IF NOT EXISTS request_type TEXT NOT NULL DEFAULT 'package_upgrade';

-- Add a check constraint to ensure only valid request types are used
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'chk_request_type'
  ) THEN
    ALTER TABLE package_requests ADD CONSTRAINT chk_request_type CHECK (request_type IN ('package_upgrade', 'activation'));
  END IF;
END $$;
