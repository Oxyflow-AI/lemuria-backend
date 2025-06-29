-- Migration: Clean up Western astrology fields in profiles table
-- Removes western_zodiac and western_ascendant, keeps only western_sun_sign and western_moon_sign

-- First ensure the western_sun_sign and western_moon_sign columns exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS western_sun_sign VARCHAR(50),
ADD COLUMN IF NOT EXISTS western_moon_sign VARCHAR(50);

-- Add constraints for the western astrology fields we're keeping
ALTER TABLE public.profiles 
ADD CONSTRAINT IF NOT EXISTS profiles_western_sun_sign_check 
    CHECK (western_sun_sign IS NULL OR is_valid_zodiac_sign(western_sun_sign));

ALTER TABLE public.profiles 
ADD CONSTRAINT IF NOT EXISTS profiles_western_moon_sign_check 
    CHECK (western_moon_sign IS NULL OR is_valid_zodiac_sign(western_moon_sign));

-- Add indexes for performance on the western astrology fields we're keeping
CREATE INDEX IF NOT EXISTS idx_profiles_western_sun_sign ON public.profiles(western_sun_sign);
CREATE INDEX IF NOT EXISTS idx_profiles_western_moon_sign ON public.profiles(western_moon_sign);

-- Remove western_ascendant column and related constraints/indexes if they exist
DROP INDEX IF EXISTS idx_profiles_western_ascendant;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_western_ascendant_check;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS western_ascendant;

-- Remove western_zodiac column and related constraints/indexes
DROP INDEX IF EXISTS idx_profiles_western_zodiac;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_western_zodiac_check;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS western_zodiac;

-- Update the updated_at timestamp
UPDATE public.profiles SET updated_at = NOW() WHERE updated_at IS NOT NULL;