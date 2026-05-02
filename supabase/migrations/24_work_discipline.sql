-- Migration 24: Work Discipline Logs and Working Hours
-- Add work_start_time and work_end_time to profiles
ALTER TABLE "public"."profiles" 
ADD COLUMN IF NOT EXISTS "work_start_time" time,
ADD COLUMN IF NOT EXISTS "work_end_time" time;

-- Create work_discipline_logs table
CREATE TABLE IF NOT EXISTS "public"."work_discipline_logs" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL REFERENCES auth.users(id),
    "log_date" date NOT NULL,
    "type" text NOT NULL CHECK (type IN ('early_start', 'early_close', 'missed_close_penalty')),
    "scheduled_time" time,
    "actual_time" timestamptz NOT NULL,
    "reason" text,
    "xp_delta" integer DEFAULT 0,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

-- Index to prevent duplicate penalty on the same day
CREATE UNIQUE INDEX IF NOT EXISTS "idx_work_discipline_unique" ON "public"."work_discipline_logs" ("user_id", "log_date", "type");

-- RLS
ALTER TABLE "public"."work_discipline_logs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own discipline logs" 
ON "public"."work_discipline_logs" 
FOR SELECT 
USING (auth.uid() = user_id);
