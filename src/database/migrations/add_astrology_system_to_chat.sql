-- Migration: Add astrology_system to chat table
-- Date: 2025-06-29

-- Add astrology_system column to chat table
ALTER TABLE public.chat 
ADD COLUMN astrology_system public.astrology_system_type NOT NULL DEFAULT 'VEDIC';

-- Add index for better query performance
CREATE INDEX idx_chat_astrology_system ON public.chat(astrology_system);
CREATE INDEX idx_chat_account_astrology ON public.chat(account_id, astrology_system);
CREATE INDEX idx_chat_profile_astrology ON public.chat(profile_id, astrology_system) WHERE profile_id IS NOT NULL;

-- Update RLS policies to include astrology_system
DROP POLICY IF EXISTS "chat_select_policy" ON public.chat;
DROP POLICY IF EXISTS "chat_insert_policy" ON public.chat;
DROP POLICY IF EXISTS "chat_update_policy" ON public.chat;

CREATE POLICY "chat_select_policy" ON public.chat
    FOR SELECT USING (
        account_id IN (
            SELECT account_id FROM public.accounts WHERE user_id = auth.uid()
        ) AND is_deleted = FALSE
    );

CREATE POLICY "chat_insert_policy" ON public.chat
    FOR INSERT WITH CHECK (
        account_id IN (
            SELECT account_id FROM public.accounts WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "chat_update_policy" ON public.chat
    FOR UPDATE USING (
        account_id IN (
            SELECT account_id FROM public.accounts WHERE user_id = auth.uid()
        )
    );