-- Migration 31: Lock gamified_task inserts and restrict to safe updates

-- First drop the broad policy
DROP POLICY IF EXISTS "Users can manage own gamified_tasks" ON gamified_tasks;

-- Create strict SELECT policy
CREATE POLICY "Users can view own gamified_tasks"
ON gamified_tasks
FOR SELECT
USING (user_id = auth.uid());

-- Create restricted UPDATE policy (since fields are locked via trigger, this just adds RLS constraint)
CREATE POLICY "Users can update safe gamified_task fields"
ON gamified_tasks
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Do NOT create INSERT or DELETE policies for authenticated users.
-- This effectively blocks INSERT and DELETE from standard clients.

-- Note: the secure_gamified_tasks_completion trigger already prevents updates to critical fields like:
-- is_completed, completed_at, xp_awarded, source, auto_verify, points, template_id, action_type, title, date, category

-- CLEANUP OLD MALICIOUS DATA
-- Turn off auto_verify for admin_template tasks with invalid template_ids
UPDATE gamified_tasks
SET auto_verify = false
WHERE source = 'admin_template' AND (template_id IS NULL OR NOT EXISTS (SELECT 1 FROM task_templates WHERE id = gamified_tasks.template_id));

-- Turn off auto_verify for 'admin' tasks that might have been fraudulently created (conservative approach)
UPDATE gamified_tasks
SET auto_verify = false
WHERE source = 'admin' AND auto_verify = true;

-- Cap absurd points to a reasonable upper bound to prevent XP inflation
UPDATE gamified_tasks
SET points = 500
WHERE points > 500;

