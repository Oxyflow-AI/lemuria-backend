-- =====================================================
-- Database Schema for Astrology System
-- Following exact specifications with proper naming conventions
-- =====================================================

-- Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS public.account_settings CASCADE;
DROP TABLE IF EXISTS public.chat CASCADE;
DROP TABLE IF EXISTS public.account_membership CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS public.language_type CASCADE;
DROP TYPE IF EXISTS public.sender_type CASCADE;
DROP TYPE IF EXISTS public.gender_type CASCADE;
DROP TYPE IF EXISTS public.astrology_system_type CASCADE;

-- Create custom types
CREATE TYPE public.language_type AS ENUM ('ENGLISH', 'TAMIL', 'HINDI');
CREATE TYPE public.sender_type AS ENUM ('USER', 'BOT');
CREATE TYPE public.gender_type AS ENUM ('MALE', 'FEMALE', 'RATHER_NOT_SAY');
CREATE TYPE public.astrology_system_type AS ENUM ('WESTERN', 'VEDIC');

-- =====================================================
-- VALIDATION FUNCTIONS
-- =====================================================

-- Function to validate zodiac signs
CREATE OR REPLACE FUNCTION public.is_valid_zodiac_sign(sign TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN sign IN (
        'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
        'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to validate Vedic rasis
CREATE OR REPLACE FUNCTION public.is_valid_rasi(rasi TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN rasi IN (
        'Mesha', 'Vrishabha', 'Mithuna', 'Kataka', 'Simha', 'Kanya',
        'Tula', 'Vrischika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to validate nakshatras
CREATE OR REPLACE FUNCTION public.is_valid_nakshatra(nakshatra TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN nakshatra IN (
        'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
        'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
        'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
        'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
        'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================
CREATE TABLE public.profiles (
    profile_id SERIAL CONSTRAINT profiles_pk PRIMARY KEY,
    firstname VARCHAR(100) NOT NULL,
    middlename VARCHAR(100),
    lastname VARCHAR(100),
    gender public.gender_type NOT NULL,
    date_of_birth DATE,
    time_of_birth TIME,
    place_of_birth VARCHAR(200),
    timezone VARCHAR(50),
    -- Western astrology fields (only sun and moon signs are stored)
    western_sun_sign VARCHAR(50),
    western_moon_sign VARCHAR(50),
    -- Vedic astrology fields
    vedic_rasi VARCHAR(50),
    vedic_nakshatra VARCHAR(50),
    vedic_lagna VARCHAR(50),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints with proper naming convention
    CONSTRAINT profiles_firstname_check CHECK (LENGTH(TRIM(firstname)) > 0),
    CONSTRAINT profiles_date_of_birth_check CHECK (date_of_birth >= '1900-01-01' AND date_of_birth <= CURRENT_DATE),
    CONSTRAINT profiles_time_of_birth_check CHECK (time_of_birth >= '00:00:00' AND time_of_birth <= '23:59:59'),
    CONSTRAINT profiles_western_sun_sign_check CHECK (western_sun_sign IS NULL OR is_valid_zodiac_sign(western_sun_sign)),
    CONSTRAINT profiles_western_moon_sign_check CHECK (western_moon_sign IS NULL OR is_valid_zodiac_sign(western_moon_sign)),
    CONSTRAINT profiles_vedic_rasi_check CHECK (vedic_rasi IS NULL OR is_valid_rasi(vedic_rasi)),
    CONSTRAINT profiles_vedic_nakshatra_check CHECK (vedic_nakshatra IS NULL OR is_valid_nakshatra(vedic_nakshatra)),
    CONSTRAINT profiles_deleted_at_check CHECK (
        (is_deleted = FALSE AND deleted_at IS NULL) OR 
        (is_deleted = TRUE AND deleted_at IS NOT NULL)
    )
);

-- =====================================================
-- 2. ACCOUNTS TABLE
-- =====================================================
CREATE TABLE public.accounts (
    account_id SERIAL CONSTRAINT accounts_pk PRIMARY KEY,
    user_id UUID NOT NULL, -- References auth.users.id from Supabase Auth
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints with proper naming convention
    CONSTRAINT accounts_user_id_unique UNIQUE (user_id)
);

-- =====================================================
-- 3. ACCOUNT MEMBERSHIP TABLE
-- =====================================================
CREATE TABLE public.account_membership (
    membership_id SERIAL CONSTRAINT account_membership_pk PRIMARY KEY,
    account_id INTEGER NOT NULL,
    profile_id INTEGER NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints with proper naming convention
    CONSTRAINT account_membership_account_id_fk FOREIGN KEY (account_id) REFERENCES public.accounts(account_id) ON DELETE CASCADE,
    CONSTRAINT account_membership_profile_id_fk FOREIGN KEY (profile_id) REFERENCES public.profiles(profile_id) ON DELETE CASCADE,
    CONSTRAINT account_membership_unique UNIQUE (account_id, profile_id)
);

-- =====================================================
-- 4. CHAT TABLE
-- =====================================================
CREATE TABLE public.chat (
    message_id SERIAL CONSTRAINT chat_pk PRIMARY KEY,
    account_id INTEGER NOT NULL,
    profile_id INTEGER,
    sender_type public.sender_type NOT NULL,
    content TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints with proper naming convention
    CONSTRAINT chat_account_id_fk FOREIGN KEY (account_id) REFERENCES public.accounts(account_id) ON DELETE CASCADE,
    CONSTRAINT chat_profile_id_fk FOREIGN KEY (profile_id) REFERENCES public.profiles(profile_id) ON DELETE SET NULL,
    CONSTRAINT chat_content_check CHECK (LENGTH(TRIM(content)) > 0),
    CONSTRAINT chat_deleted_at_check CHECK (
        (is_deleted = FALSE AND deleted_at IS NULL) OR 
        (is_deleted = TRUE AND deleted_at IS NOT NULL)
    )
);

-- =====================================================
-- 5. ACCOUNT SETTINGS TABLE
-- =====================================================
CREATE TABLE public.account_settings (
    account_id INTEGER CONSTRAINT account_settings_pk PRIMARY KEY,
    preferred_language public.language_type DEFAULT 'ENGLISH',
    astrology_system public.astrology_system_type DEFAULT 'VEDIC',
    timezone VARCHAR(50) DEFAULT 'UTC',
    notification_preferences JSONB DEFAULT '{}',
    theme VARCHAR(20) DEFAULT 'light',
    primary_profile INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints with proper naming convention
    CONSTRAINT account_settings_account_id_fk FOREIGN KEY (account_id) REFERENCES public.accounts(account_id) ON DELETE CASCADE,
    CONSTRAINT account_settings_theme_check CHECK (theme IN ('light', 'dark', 'auto')),
    CONSTRAINT account_settings_primary_profile_fk FOREIGN KEY (primary_profile) REFERENCES public.profiles(profile_id) ON DELETE SET NULL
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Accounts indexes
CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);

-- Account membership indexes
CREATE INDEX idx_account_membership_account_id ON public.account_membership(account_id);
CREATE INDEX idx_account_membership_profile_id ON public.account_membership(profile_id);

-- Profiles indexes
CREATE INDEX idx_profiles_firstname ON public.profiles(firstname);
CREATE INDEX idx_profiles_gender ON public.profiles(gender);
CREATE INDEX idx_profiles_date_of_birth ON public.profiles(date_of_birth);
CREATE INDEX idx_profiles_place_of_birth ON public.profiles(place_of_birth);
CREATE INDEX idx_profiles_western_sun_sign ON public.profiles(western_sun_sign);
CREATE INDEX idx_profiles_western_moon_sign ON public.profiles(western_moon_sign);
CREATE INDEX idx_profiles_vedic_rasi ON public.profiles(vedic_rasi);
CREATE INDEX idx_profiles_vedic_nakshatra ON public.profiles(vedic_nakshatra);
CREATE INDEX idx_profiles_is_deleted ON public.profiles(is_deleted);
CREATE INDEX idx_profiles_active ON public.profiles(profile_id, is_deleted) WHERE is_deleted = FALSE;

-- Account settings indexes
CREATE INDEX idx_account_settings_preferred_language ON public.account_settings(preferred_language);
CREATE INDEX idx_account_settings_timezone ON public.account_settings(timezone);

-- Chat indexes
CREATE INDEX idx_chat_account_id ON public.chat(account_id);
CREATE INDEX idx_chat_profile_id ON public.chat(profile_id);
CREATE INDEX idx_chat_sender_type ON public.chat(sender_type);
CREATE INDEX idx_chat_created_at ON public.chat(created_at DESC);
CREATE INDEX idx_chat_is_deleted ON public.chat(is_deleted);
CREATE INDEX idx_chat_active_messages ON public.chat(account_id, is_deleted, created_at DESC) WHERE is_deleted = FALSE;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat ENABLE ROW LEVEL SECURITY;

-- Accounts: Users can only access their own account
CREATE POLICY "accounts_select_policy" ON public.accounts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "accounts_insert_policy" ON public.accounts
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "accounts_update_policy" ON public.accounts
    FOR UPDATE USING (user_id = auth.uid());

-- Profiles: Users can only access non-deleted profiles linked to their account
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT USING (
        profile_id IN (
            SELECT am.profile_id 
            FROM public.account_membership am
            JOIN public.accounts a ON a.account_id = am.account_id
            WHERE a.user_id = auth.uid()
        ) AND is_deleted = FALSE
    );

CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); -- Allow any authenticated user

CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE USING (
        profile_id IN (
            SELECT am.profile_id 
            FROM public.account_membership am
            JOIN public.accounts a ON a.account_id = am.account_id
            WHERE a.user_id = auth.uid()
        )
    );

-- Account membership: Users can only access their own memberships
CREATE POLICY "account_membership_select_policy" ON public.account_membership
    FOR SELECT USING (
        account_id IN (
            SELECT account_id FROM public.accounts WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "account_membership_insert_policy" ON public.account_membership
    FOR INSERT WITH CHECK (
        account_id IN (
            SELECT account_id FROM public.accounts WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "account_membership_update_policy" ON public.account_membership
    FOR UPDATE USING (
        account_id IN (
            SELECT account_id FROM public.accounts WHERE user_id = auth.uid()
        )
    );

-- Account settings: Users can only access their own settings
CREATE POLICY "account_settings_select_policy" ON public.account_settings
    FOR SELECT USING (
        account_id IN (
            SELECT account_id FROM public.accounts WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "account_settings_insert_policy" ON public.account_settings
    FOR INSERT WITH CHECK (
        account_id IN (
            SELECT account_id FROM public.accounts WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "account_settings_update_policy" ON public.account_settings
    FOR UPDATE USING (
        account_id IN (
            SELECT account_id FROM public.accounts WHERE user_id = auth.uid()
        )
    );

-- Chat: Users can only access their own non-deleted chat messages
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

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER profiles_update_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER accounts_update_updated_at
    BEFORE UPDATE ON public.accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER account_settings_update_updated_at
    BEFORE UPDATE ON public.account_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();


-- Function to ensure primary_profile belongs to the account
CREATE OR REPLACE FUNCTION public.validate_primary_profile_settings()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a primary_profile, ensure it belongs to this account
    IF NEW.primary_profile IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.account_membership 
            WHERE account_id = NEW.account_id 
            AND profile_id = NEW.primary_profile
        ) THEN
            RAISE EXCEPTION 'Primary profile must belong to the account';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate primary profile in account settings
CREATE TRIGGER account_settings_validate_primary_profile
    BEFORE INSERT OR UPDATE ON public.account_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_primary_profile_settings();

-- Function to ensure account membership consistency
CREATE OR REPLACE FUNCTION public.validate_account_membership()
RETURNS TRIGGER AS $$
BEGIN
    -- When deleting a profile membership, ensure it's not the primary profile
    IF TG_OP = 'DELETE' THEN
        IF EXISTS (
            SELECT 1 FROM public.account_settings 
            WHERE account_id = OLD.account_id 
            AND primary_profile = OLD.profile_id
        ) THEN
            RAISE EXCEPTION 'Cannot remove primary profile from account membership';
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate account membership
CREATE TRIGGER account_membership_validate
    BEFORE DELETE ON public.account_membership
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_account_membership();

-- =====================================================
-- PROFILE MANAGEMENT TRIGGERS
-- =====================================================

-- Function to set primary profile when first profile is created for an account
CREATE OR REPLACE FUNCTION public.set_primary_profile_on_creation()
RETURNS TRIGGER AS $$
DECLARE
    profile_count INTEGER;
BEGIN
    -- Count total profiles for this account (excluding deleted ones)
    SELECT COUNT(*) INTO profile_count
    FROM public.account_membership am
    JOIN public.profiles p ON p.profile_id = am.profile_id
    WHERE am.account_id = NEW.account_id
    AND p.is_deleted = FALSE;
    
    -- If this is the first profile, set it as primary
    IF profile_count = 1 THEN
        UPDATE public.account_settings
        SET primary_profile = NEW.profile_id
        WHERE account_id = NEW.account_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for account membership creation (fires when profile is linked to account)
CREATE TRIGGER profile_set_primary_on_creation
    AFTER INSERT ON public.account_membership
    FOR EACH ROW
    EXECUTE FUNCTION public.set_primary_profile_on_creation();

-- Function to update primary profile when current primary is deleted
CREATE OR REPLACE FUNCTION public.update_primary_profile_on_deletion()
RETURNS TRIGGER AS $$
DECLARE
    account_id_var INTEGER;
    new_primary_profile_id INTEGER;
BEGIN
    -- Only process if profile is being marked as deleted
    IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
        -- Find all accounts where this profile is primary
        FOR account_id_var IN 
            SELECT account_id 
            FROM public.account_settings 
            WHERE primary_profile = NEW.profile_id
        LOOP
            -- Find the earliest non-deleted profile for this account
            SELECT p.profile_id INTO new_primary_profile_id
            FROM public.account_membership am
            JOIN public.profiles p ON p.profile_id = am.profile_id
            WHERE am.account_id = account_id_var
            AND p.is_deleted = FALSE
            AND p.profile_id != NEW.profile_id
            ORDER BY p.created_at ASC
            LIMIT 1;
            
            -- Update primary profile to the new one (or NULL if no profiles left)
            UPDATE public.account_settings
            SET primary_profile = new_primary_profile_id
            WHERE account_id = account_id_var;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profile update (deletion)
CREATE TRIGGER profile_update_primary_on_deletion
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_primary_profile_on_deletion();

-- Function to prevent deletion of last profile in an account
CREATE OR REPLACE FUNCTION public.prevent_last_profile_deletion()
RETURNS TRIGGER AS $$
DECLARE
    account_id_var INTEGER;
    active_profile_count INTEGER;
BEGIN
    -- Only check if profile is being marked as deleted
    IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
        -- Get the account_id for this profile
        SELECT am.account_id INTO account_id_var
        FROM public.account_membership am
        WHERE am.profile_id = NEW.profile_id
        LIMIT 1;
        
        IF account_id_var IS NOT NULL THEN
            -- Count active profiles for this account (excluding the one being deleted)
            SELECT COUNT(*) INTO active_profile_count
            FROM public.account_membership am
            JOIN public.profiles p ON p.profile_id = am.profile_id
            WHERE am.account_id = account_id_var
            AND p.is_deleted = FALSE
            AND p.profile_id != NEW.profile_id;
            
            -- Prevent deletion if this is the last active profile
            IF active_profile_count = 0 THEN
                RAISE EXCEPTION 'Cannot delete the last profile in an account. At least one profile must remain active.';
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent deletion of last profile
CREATE TRIGGER profile_prevent_last_deletion
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_last_profile_deletion();

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- Insert a completion log
DO $$
BEGIN
    RAISE NOTICE 'Database schema created successfully!';
    RAISE NOTICE 'Tables created: profiles, accounts, account_membership, account_settings, chat';
    RAISE NOTICE 'Enhanced profiles table with: gender, place_of_birth, latitude, longitude, timezone';
    RAISE NOTICE 'All constraints follow naming convention: <table_name>_<constraint_type>';
    RAISE NOTICE 'RLS policies, indexes, and triggers are in place.';
    RAISE NOTICE 'Gender types: MALE, FEMALE, RATHER_NOT_SAY';
    RAISE NOTICE 'Account settings include: language, timezone, notifications, theme';
    RAISE NOTICE 'Ready for astrology application data!';
END $$;