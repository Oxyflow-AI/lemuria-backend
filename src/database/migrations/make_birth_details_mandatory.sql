-- Migration: Make birth details mandatory in profiles table
-- Updates date_of_birth, time_of_birth, and place_of_birth to be NOT NULL

-- First, ensure all existing profiles have birth data or set defaults
UPDATE public.profiles 
SET 
    date_of_birth = COALESCE(date_of_birth, '1990-01-01'),
    time_of_birth = COALESCE(time_of_birth, '12:00:00'),
    place_of_birth = COALESCE(place_of_birth, 'Unknown')
WHERE date_of_birth IS NULL OR time_of_birth IS NULL OR place_of_birth IS NULL;

-- Now make the columns NOT NULL
ALTER TABLE public.profiles 
ALTER COLUMN date_of_birth SET NOT NULL;

ALTER TABLE public.profiles 
ALTER COLUMN time_of_birth SET NOT NULL;

ALTER TABLE public.profiles 
ALTER COLUMN place_of_birth SET NOT NULL;

-- Update constraints to ensure birth details validation
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_date_of_birth_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_date_of_birth_check 
    CHECK (date_of_birth >= '1900-01-01' AND date_of_birth <= CURRENT_DATE);

-- Update the updated_at timestamp
UPDATE public.profiles SET updated_at = NOW() WHERE updated_at IS NOT NULL;