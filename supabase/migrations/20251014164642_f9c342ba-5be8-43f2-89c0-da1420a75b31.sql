-- Add approval code field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN level3_approval_code TEXT;

-- Add index for faster lookups
CREATE INDEX idx_profiles_approval_code ON public.profiles(level3_approval_code);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.level3_approval_code IS 'Generated approval code when user passes Level 3 Part 1 exam';