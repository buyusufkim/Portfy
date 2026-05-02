-- Migration 30: Lock gamified_task critical fields

CREATE OR REPLACE FUNCTION secure_gamified_tasks_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Only restrict updates if the user is a standard web client (authenticated role)
    IF current_setting('role', true) = 'authenticated' THEN
        IF OLD.is_completed IS DISTINCT FROM NEW.is_completed OR
           OLD.completed_at IS DISTINCT FROM NEW.completed_at OR
           OLD.xp_awarded IS DISTINCT FROM NEW.xp_awarded OR
           OLD.source IS DISTINCT FROM NEW.source OR
           OLD.auto_verify IS DISTINCT FROM NEW.auto_verify OR
           OLD.points IS DISTINCT FROM NEW.points OR
           OLD.template_id IS DISTINCT FROM NEW.template_id OR
           OLD.action_type IS DISTINCT FROM NEW.action_type OR
           OLD.title IS DISTINCT FROM NEW.title OR
           OLD.date IS DISTINCT FROM NEW.date OR
           OLD.category IS DISTINCT FROM NEW.category THEN
            RAISE EXCEPTION 'Updates to critical fields must be done via the secure server endpoint.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger is not strictly necessary if we just updated the function
-- but good practice in case it was dropped
DROP TRIGGER IF EXISTS tr_secure_gamified_tasks_completion ON gamified_tasks;

CREATE TRIGGER tr_secure_gamified_tasks_completion
BEFORE UPDATE ON gamified_tasks
FOR EACH ROW
EXECUTE FUNCTION secure_gamified_tasks_completion();
