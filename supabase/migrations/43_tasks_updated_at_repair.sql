-- Add updated_at to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add completed_at to tasks if it doesn't exist
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- If there's an updated_at_trigger, apply it if possible, otherwise it's fine
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_tasks_updated_at') THEN
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
            CREATE TRIGGER set_tasks_updated_at
            BEFORE UPDATE ON public.tasks
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
        END IF;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
