CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS owner_portal_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_viewed_at TIMESTAMPTZ,
    view_count INTEGER DEFAULT 0
);

ALTER TABLE owner_portal_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can manage their own portal tokens" ON owner_portal_tokens;
    CREATE POLICY "Users can manage their own portal tokens" ON owner_portal_tokens 
        FOR ALL USING (auth.uid() = created_by);
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE OR REPLACE FUNCTION increment_portal_view(token_val text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE owner_portal_tokens
  SET view_count = view_count + 1,
      last_viewed_at = NOW()
  WHERE token = token_val;
END;
$$;
