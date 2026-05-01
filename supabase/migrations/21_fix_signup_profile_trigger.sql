-- Create or replace the handle_new_user function to create a profile automatically when a user signs up.
-- Also binds the trigger to auth.users

-- Ensure the function is run with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    display_name,
    email,
    phone,
    role,
    tier,
    subscription_type,
    ai_tokens_used,
    ai_token_limit,
    total_xp,
    broker_level,
    current_streak,
    longest_streak,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    'agent',
    'free',
    'none',
    0,
    NULL,
    0,
    1,
    0,
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
    phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop the trigger if it exists to replace it safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
