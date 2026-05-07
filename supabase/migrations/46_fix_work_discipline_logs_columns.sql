-- Migration 46: Fix work_discipline_logs columns
-- Ensure the columns exist on work_discipline_logs, no matter how the table was created (e.g. via 24 or 37).

-- Create the type in a safe manner if needed, otherwise just use text.
ALTER TABLE "public"."work_discipline_logs" ADD COLUMN IF NOT EXISTS "type" text;
ALTER TABLE "public"."work_discipline_logs" ADD COLUMN IF NOT EXISTS "actual_time" timestamptz DEFAULT now();
ALTER TABLE "public"."work_discipline_logs" ADD COLUMN IF NOT EXISTS "reason" text;
ALTER TABLE "public"."work_discipline_logs" ADD COLUMN IF NOT EXISTS "xp_delta" integer DEFAULT 0;
ALTER TABLE "public"."work_discipline_logs" ADD COLUMN IF NOT EXISTS "scheduled_time" time;

-- We also make sure the user_id references auth.users(id) properly with cascading.
-- (No need to alter it if it's already there)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema='public' AND table_name='work_discipline_logs' AND column_name='user_id'
    ) THEN
        ALTER TABLE "public"."work_discipline_logs" ADD COLUMN "user_id" uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- If 'type' is null but there is an event_type or action_type column (if any), we can coalesce.
-- (There's none known in this schema but good to be safe)

-- Ensure RLS is enabled and user policy exists
ALTER TABLE "public"."work_discipline_logs" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own discipline logs" ON "public"."work_discipline_logs";
    CREATE POLICY "Users can view their own discipline logs" 
    ON "public"."work_discipline_logs" 
    FOR SELECT 
    USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can manage their work_discipline_logs" ON "public"."work_discipline_logs";
    CREATE POLICY "Users can manage their work_discipline_logs" 
    ON "public"."work_discipline_logs" 
    FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);
END $$;
