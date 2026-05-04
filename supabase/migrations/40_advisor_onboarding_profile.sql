CREATE TABLE IF NOT EXISTS public.advisor_professional_profiles (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    experience_level text NOT NULL DEFAULT 'new',
    experience_years integer,
    profession_start_date date,
    campaign_start_reason text,
    "current_role" text,
    has_myk boolean DEFAULT false,
    myk_level text,
    myk_certificate_no text,
    myk_issue_date date,
    myk_renewal_date date,
    myk_reminder_enabled boolean DEFAULT true,
    has_real_estate_authorization boolean DEFAULT false,
    authorization_no text,
    authorization_issue_date date,
    authorization_renewal_date date,
    has_office boolean DEFAULT false,
    office_name text,
    office_brand text,
    office_role text,
    office_phone text,
    office_address text,
    has_tax_registration boolean DEFAULT false,
    tax_identity_type text,
    tax_identity_masked text,
    tax_identity_last4 text,
    display_name text,
    professional_title text,
    report_signature_title text,
    public_phone text,
    public_email text,
    region text,
    niche text,
    daily_available_hours numeric,
    preferred_work_intensity text DEFAULT 'standard',
    weekly_contact_target integer,
    daily_contact_target integer,
    onboarding_completed boolean DEFAULT false,
    onboarding_completed_at timestamptz,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.advisor_professional_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.advisor_professional_profiles;
CREATE POLICY "Users can view own profile"
    ON public.advisor_professional_profiles FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.advisor_professional_profiles;
CREATE POLICY "Users can insert own profile"
    ON public.advisor_professional_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.advisor_professional_profiles;
CREATE POLICY "Users can update own profile"
    ON public.advisor_professional_profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.advisor_professional_profiles;
CREATE POLICY "Users can delete own profile"
    ON public.advisor_professional_profiles FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_advisor_professional_profiles_user_id ON public.advisor_professional_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_advisor_professional_profiles_myk_renewal_date ON public.advisor_professional_profiles(myk_renewal_date);
CREATE INDEX IF NOT EXISTS idx_advisor_professional_profiles_authorization_renewal_date ON public.advisor_professional_profiles(authorization_renewal_date);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_advisor_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_advisor_professional_profiles_updated_at ON public.advisor_professional_profiles;
CREATE TRIGGER trg_advisor_professional_profiles_updated_at
BEFORE UPDATE ON public.advisor_professional_profiles
FOR EACH ROW
EXECUTE FUNCTION update_advisor_profile_updated_at();

NOTIFY pgrst, 'reload schema';
