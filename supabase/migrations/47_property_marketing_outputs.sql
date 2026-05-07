-- Migration 47: Feature Marketing Outputs
CREATE TABLE IF NOT EXISTS public.property_marketing_outputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  output_type text not null default 'full_marketing_pack',
  output_json jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, property_id, output_type)
);

ALTER TABLE public.property_marketing_outputs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can manage their marketing outputs" ON public.property_marketing_outputs;
    CREATE POLICY "Users can manage their marketing outputs" 
    ON public.property_marketing_outputs 
    FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);
END $$;
