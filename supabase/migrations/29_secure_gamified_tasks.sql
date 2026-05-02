-- Migration 29: Secure gamified tasks completion

CREATE OR REPLACE FUNCTION secure_gamified_tasks_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Only restrict updates if the user is a standard web client (authenticated role)
    IF current_setting('role', true) = 'authenticated' THEN
        IF OLD.is_completed IS DISTINCT FROM NEW.is_completed OR
           OLD.completed_at IS DISTINCT FROM NEW.completed_at OR
           OLD.xp_awarded IS DISTINCT FROM NEW.xp_awarded THEN
            RAISE EXCEPTION 'Updates to completion status must be done via the secure server endpoint.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS tr_secure_gamified_tasks_completion ON gamified_tasks;

-- Create the trigger
CREATE TRIGGER tr_secure_gamified_tasks_completion
BEFORE UPDATE ON gamified_tasks
FOR EACH ROW
EXECUTE FUNCTION secure_gamified_tasks_completion();
