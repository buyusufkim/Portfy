-- Safely drop any existing check constraint on the 'role' column of 'profiles' table
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT pg_constraint.conname INTO constraint_name
    FROM pg_constraint
    JOIN pg_attribute ON pg_attribute.attrelid = pg_constraint.conrelid AND pg_attribute.attnum = ANY(pg_constraint.conkey)
    WHERE pg_constraint.conrelid = 'public.profiles'::regclass
      AND pg_attribute.attname = 'role'
      AND pg_constraint.contype = 'c';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

-- Add the new check constraint supporting 'super_admin'
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('agent', 'admin', 'super_admin'));

-- Update the is_admin helper function to treat super_admin as an admin for RLS policies
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
