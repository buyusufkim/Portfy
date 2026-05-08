-- Migration 55: Campaign 90 Admin Followups

CREATE TABLE IF NOT EXISTS public.campaign90_admin_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    campaign_id UUID NULL,
    day_number INT NULL CHECK (day_number BETWEEN 1 AND 90),
    action_type TEXT NOT NULL DEFAULT 'note',
    status TEXT NOT NULL DEFAULT 'open',
    priority TEXT NOT NULL DEFAULT 'normal',
    note TEXT NOT NULL,
    due_date DATE NULL,
    resolved_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Constraints
ALTER TABLE public.campaign90_admin_followups ADD CONSTRAINT chk_followup_action_type CHECK (action_type IN ('note','call','whatsapp','mentor_support','watch','resolved_note'));
ALTER TABLE public.campaign90_admin_followups ADD CONSTRAINT chk_followup_status CHECK (status IN ('open','in_progress','resolved','dismissed'));
ALTER TABLE public.campaign90_admin_followups ADD CONSTRAINT chk_followup_priority CHECK (priority IN ('low','normal','high','urgent'));

-- Enable RLS
ALTER TABLE public.campaign90_admin_followups ENABLE ROW LEVEL SECURITY;

-- No policies needed for normal users, default deny everything.
-- Admin operations will bypass RLS via service_role key in the backend.

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_campaign90_admin_followups_updated_at ON public.campaign90_admin_followups;
CREATE TRIGGER set_campaign90_admin_followups_updated_at
BEFORE UPDATE ON public.campaign90_admin_followups
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

NOTIFY pgrst, 'reload schema';
