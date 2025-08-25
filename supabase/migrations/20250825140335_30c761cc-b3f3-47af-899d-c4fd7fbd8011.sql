-- Add level field to profiles table for candidates
ALTER TABLE public.profiles 
ADD COLUMN level text CHECK (level IN ('Junior', 'Mid-level', 'Senior'));

-- Update the handle_new_user function to not require job_role during signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Unknown'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'candidate')
  );
  RETURN NEW;
END;
$function$;