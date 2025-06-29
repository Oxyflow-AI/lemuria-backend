-- Migration: Remove astrology_system from chat table
-- Date: 2025-06-29
-- Reason: Astrology system is now determined by account_settings, not stored per message
--
-- IMPORTANT: This migration reverses the add_astrology_system_to_chat.sql migration
-- The unified chat controller approach means we determine the astrology system
-- from the user's account_settings, not from individual chat messages.

BEGIN;

-- Drop indexes that were created for astrology_system column
DROP INDEX IF EXISTS public.idx_chat_astrology_system;
DROP INDEX IF EXISTS public.idx_chat_account_astrology;
DROP INDEX IF EXISTS public.idx_chat_profile_astrology;

-- Remove astrology_system column from chat table
ALTER TABLE public.chat 
DROP COLUMN IF EXISTS astrology_system;

-- Verify the astrology_system column still exists in account_settings (it should)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'account_settings' 
        AND column_name = 'astrology_system'
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'ERROR: astrology_system column missing from account_settings table!';
    END IF;
    
    RAISE NOTICE 'SUCCESS: astrology_system properly configured in account_settings';
END
$$;

COMMIT;

-- Note: RLS policies remain the same as they don't depend on astrology_system
-- The unified chat controller now determines the system from account_settings