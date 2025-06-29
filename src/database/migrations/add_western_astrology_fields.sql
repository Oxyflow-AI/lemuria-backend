-- Migration: Add Western astrology fields to profiles table
-- Adds western_sun_sign, western_moon_sign, and western_ascendant fields

-- Add the new Western astrology columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS western_sun_sign VARCHAR(50),
ADD COLUMN IF NOT EXISTS western_moon_sign VARCHAR(50),
ADD COLUMN IF NOT EXISTS western_ascendant VARCHAR(50);

-- Add constraints for the new Western astrology fields
ALTER TABLE public.profiles 
ADD CONSTRAINT IF NOT EXISTS profiles_western_sun_sign_check 
    CHECK (western_sun_sign IS NULL OR is_valid_zodiac_sign(western_sun_sign));

ALTER TABLE public.profiles 
ADD CONSTRAINT IF NOT EXISTS profiles_western_moon_sign_check 
    CHECK (western_moon_sign IS NULL OR is_valid_zodiac_sign(western_moon_sign));

ALTER TABLE public.profiles 
ADD CONSTRAINT IF NOT EXISTS profiles_western_ascendant_check 
    CHECK (western_ascendant IS NULL OR is_valid_zodiac_sign(western_ascendant));

-- Update the existing western_zodiac constraint name for consistency (if it exists)
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_western_zodiac_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT IF NOT EXISTS profiles_western_zodiac_check 
    CHECK (western_zodiac IS NULL OR is_valid_zodiac_sign(western_zodiac));

-- Add indexes for performance on the new astrology fields
CREATE INDEX IF NOT EXISTS idx_profiles_western_sun_sign ON public.profiles(western_sun_sign);
CREATE INDEX IF NOT EXISTS idx_profiles_western_moon_sign ON public.profiles(western_moon_sign);
CREATE INDEX IF NOT EXISTS idx_profiles_western_ascendant ON public.profiles(western_ascendant);

-- Update the updated_at timestamp
UPDATE public.profiles SET updated_at = NOW() WHERE updated_at IS NOT NULL;