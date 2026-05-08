-- Migration 54: Campaign 90 Day Answers

CREATE TABLE IF NOT EXISTS public.campaign90_day_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_number INT NOT NULL CHECK (day_number BETWEEN 1 AND 90),
    campaign_id UUID NULL,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    answered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_day_answer UNIQUE(user_id, day_number)
);

-- Enable RLS
ALTER TABLE public.campaign90_day_answers ENABLE ROW LEVEL SECURITY;

-- Select policy: User can read own answers
CREATE POLICY "Users can read own campaign90_day_answers" 
ON public.campaign90_day_answers FOR SELECT 
USING (auth.uid() = user_id);

-- Insert policy: User can insert own answers
CREATE POLICY "Users can insert own campaign90_day_answers" 
ON public.campaign90_day_answers FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update policy: User can update own answers
CREATE POLICY "Users can update own campaign90_day_answers" 
ON public.campaign90_day_answers FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_campaign90_day_answers_updated_at ON public.campaign90_day_answers;
CREATE TRIGGER set_campaign90_day_answers_updated_at
BEFORE UPDATE ON public.campaign90_day_answers
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

NOTIFY pgrst, 'reload schema';
