-- Create the table for owner portal access tokens
CREATE TABLE owner_portal_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE, -- Long, unpredictable token
    expires_at TIMESTAMPTZ NOT NULL,     -- Token expiration timestamp
    revoked_at TIMESTAMPTZ,              -- Timestamp when token was revoked
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- User who created the token
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    last_viewed_at TIMESTAMPTZ,          -- Timestamp of the last access
    view_count INT DEFAULT 0             -- Number of times the token has been used
);

-- Enable RLS for the new table
ALTER TABLE owner_portal_tokens ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own tokens
CREATE POLICY "Allow user to view their own tokens"
ON owner_portal_tokens FOR SELECT
USING (created_by = auth.uid());

-- Allow insert by authenticated users
CREATE POLICY "Allow user to insert tokens"
ON owner_portal_tokens FOR INSERT
WITH CHECK (created_by = auth.uid() AND property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()));

-- Allow update (revoke) by authenticated users
CREATE POLICY "Allow user to revoke tokens"
ON owner_portal_tokens FOR UPDATE
USING (created_by = auth.uid());

-- Policy: Allow public read access to active tokens for validation (so the backend or client can query without being logged in, 
-- but in our case we said "portal verisi frontend’den doğrudan Supabase ile çekilmesin, backend endpoint ekle: GET /api/portal/:token",
-- So actually we need the backend to bypass RLS, or we use a service key role. In server.ts the backend probably uses supabase admin client or
-- we can just create a policy for reading via token since that is a hard-to-guess secret).
-- However we will do Supabase admin fetch in the backend endpoint.

-- Index for performance on token lookups
CREATE INDEX idx_owner_portal_tokens_token ON owner_portal_tokens (token);
CREATE INDEX idx_owner_portal_tokens_property_id ON owner_portal_tokens (property_id);
CREATE INDEX idx_owner_portal_tokens_expires_at ON owner_portal_tokens (expires_at);

-- Relax RLS slightly on `properties`, but wait, we want backend to fetch minimal data so backend uses service role. No need to relax RLS.
