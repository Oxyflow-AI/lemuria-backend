import { BaseService } from './baseService';
import { 
  Profile, 
  CreateProfileDto, 
  UpdateProfileDto, 
  ProfileResponseDto 
} from '../types/profileTypes';
import { QueryOptions } from '../types/baseTypes';
import { vedicAstrologyService } from './vedicAstrologyService';
import { westernAstrologyService } from './westernAstrologyService';
import { accountSettingsService } from './accountSettingsService';
import { logger } from '../utils/logger';
import { ValidationError, NotFoundError } from '../utils/errorHandler';

export class ProfileService extends BaseService {
  /**
   * Get all profiles for a user
   */
  async getAllProfiles(userId: string, options?: QueryOptions): Promise<{
    profiles: ProfileResponseDto[];
    pagination: { limit: number; offset: number; total: number };
  }> {
    const account = await this.getUserAccount(userId);

    // Get profiles with membership info - exclude deleted profiles
    let query = this.supabaseAdmin
      .from('account_membership')
      .select(`
        profile_id,
        created_at,
        profiles!inner(*)
      `)
      .eq('account_id', account.account_id)
      .eq('profiles.is_deleted', false);

    query = this.applySorting(query, options);
    query = this.applyPagination(query, options);

    const memberships = await this.executeQuery<any[]>(
      async () => query,
      'get user profiles'
    );

    // Get account settings for primary profile info
    const { data: settings } = await this.supabaseAdmin
      .from('account_settings')
      .select('primary_profile')
      .eq('account_id', account.account_id)
      .single();

    // Transform to response format
    const profiles: ProfileResponseDto[] = (memberships as any[]).map((membership: any) => ({
      ...membership.profiles,
      is_primary: settings?.primary_profile === membership.profile_id
    }));

    // Get total count
    const total = await this.getTotalCount('account_membership', { account_id: account.account_id });

    return {
      profiles,
      pagination: {
        limit: options?.limit || 50,
        offset: options?.offset || 0,
        total
      }
    };
  }

  /**
   * Get profile by ID
   */
  async getProfileById(userId: string, profileId: number): Promise<ProfileResponseDto> {
    const account = await this.getUserAccount(userId);

    // Validate ownership and get profile - exclude deleted profiles
    const membership = await this.executeQuery<any>(
      async () => this.supabaseAdmin
        .from('account_membership')
        .select(`
          profile_id,
          created_at,
          profiles!inner(*)
        `)
        .eq('account_id', account.account_id)
        .eq('profile_id', profileId)
        .eq('profiles.is_deleted', false)
        .single(),
      'get profile by ID'
    );

    // Get account settings for primary profile info
    const { data: settings } = await this.supabaseAdmin
      .from('account_settings')
      .select('primary_profile')
      .eq('account_id', account.account_id)
      .single();

    return {
      ...(membership as any).profiles,
      is_primary: settings?.primary_profile === profileId
    };
  }

  /**
   * Create new profile
   */
  async createProfile(userId: string, profileData: CreateProfileDto): Promise<ProfileResponseDto> {
    this.validateCreateProfileData(profileData);
    
    const account = await this.getUserAccount(userId);

    // Check if this is the first profile (should be primary)
    const { data: existingMemberships } = await this.supabaseAdmin
      .from('account_membership')
      .select('profile_id')
      .eq('account_id', account.account_id);

    const isFirstProfile = !existingMemberships || existingMemberships.length === 0;
    const shouldSetAsPrimary = profileData.set_as_primary || isFirstProfile;

    // Calculate astrology data (always done since birth details are mandatory)
    const calculations = await this.calculateAstrologyData(userId, profileData);
    const astrologyData = {
      // Western astrology fields (only sun and moon signs stored)
      western_sun_sign: calculations.western?.sunSign || profileData.western_sun_sign,
      western_moon_sign: calculations.western?.moonSign || profileData.western_moon_sign,
      // Vedic astrology fields
      vedic_rasi: calculations.vedic?.rasi || profileData.vedic_rasi,
      vedic_nakshatra: calculations.vedic?.nakshatra || profileData.vedic_nakshatra,
      vedic_lagna: calculations.vedic?.lagna || profileData.vedic_lagna
    };

    // Create profile
    const profile = await this.executeQuery<Profile>(
      async () => this.supabaseAdmin
        .from('profiles')
        .insert({
          firstname: profileData.firstname,
          middlename: profileData.middlename,
          lastname: profileData.lastname,
          gender: profileData.gender,
          date_of_birth: profileData.date_of_birth,
          time_of_birth: profileData.time_of_birth,
          place_of_birth: profileData.place_of_birth,
          timezone: profileData.timezone,
          ...astrologyData
        })
        .select()
        .single(),
      'create profile'
    );

    // Create account membership
    await this.executeQuery<null>(
      async () => this.supabaseAdmin
        .from('account_membership')
        .insert({
          account_id: account.account_id,
          profile_id: (profile as Profile).profile_id
        })
        .select()
        .single(),
      'create account membership'
    );

    this.logAction('Profile created', userId, { profileId: (profile as Profile).profile_id });

    return {
      ...(profile as Profile),
      is_primary: shouldSetAsPrimary
    };
  }

  /**
   * Update profile
   */
  async updateProfile(
    userId: string, 
    profileId: number, 
    updateData: UpdateProfileDto
  ): Promise<ProfileResponseDto> {
    this.validateUpdateProfileData(updateData);
    
    // Validate ownership
    await this.validateResourceOwnership('profiles', profileId, userId, 'profile_id');

    // Check if birth details are being updated to recalculate astrology
    const shouldRecalculateAstrology = updateData.date_of_birth || 
                                     updateData.time_of_birth || 
                                     updateData.place_of_birth;

    let finalUpdateData = { ...updateData };

    if (shouldRecalculateAstrology) {
      // Get current profile data to merge with updates
      const currentProfile = await this.executeQuery<Profile>(
        async () => this.supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('profile_id', profileId)
          .single(),
        'get current profile for update'
      );

      // Merge current data with updates to create complete birth data
      const completeProfileData: CreateProfileDto = {
        firstname: updateData.firstname || currentProfile.firstname,
        middlename: updateData.middlename || currentProfile.middlename,
        lastname: updateData.lastname || currentProfile.lastname,
        gender: updateData.gender || currentProfile.gender,
        date_of_birth: updateData.date_of_birth || currentProfile.date_of_birth,
        time_of_birth: updateData.time_of_birth || currentProfile.time_of_birth,
        place_of_birth: updateData.place_of_birth || currentProfile.place_of_birth,
        timezone: updateData.timezone || currentProfile.timezone
      };

      // Recalculate astrology data
      const calculations = await this.calculateAstrologyData(userId, completeProfileData);
      
      // Add calculated astrology data to update
      finalUpdateData = {
        ...finalUpdateData,
        // Western astrology fields (only sun and moon signs stored)
        western_sun_sign: calculations.western?.sunSign,
        western_moon_sign: calculations.western?.moonSign,
        // Vedic astrology fields
        vedic_rasi: calculations.vedic?.rasi,
        vedic_nakshatra: calculations.vedic?.nakshatra,
        vedic_lagna: calculations.vedic?.lagna
      };
    }

    // Update profile
    const profile = await this.executeQuery<Profile>(
      async () => this.supabaseAdmin
        .from('profiles')
        .update(finalUpdateData)
        .eq('profile_id', profileId)
        .select()
        .single(),
      'update profile'
    );

    this.logAction('Profile updated', userId, { profileId, recalculatedAstrology: shouldRecalculateAstrology });

    // Get account settings for primary profile info
    const account = await this.getUserAccount(userId);
    const { data: settings } = await this.supabaseAdmin
      .from('account_settings')
      .select('primary_profile')
      .eq('account_id', account.account_id)
      .single();

    return {
      ...(profile as Profile),
      is_primary: settings?.primary_profile === profileId
    };
  }

  /**
   * Delete profile (soft delete)
   */
  async deleteProfile(userId: string, profileId: number): Promise<void> {
    // Validate ownership
    await this.validateResourceOwnership('profiles', profileId, userId, 'profile_id');

    // Check if profile is already deleted
    const { data: existingProfile } = await this.supabaseAdmin
      .from('profiles')
      .select('is_deleted')
      .eq('profile_id', profileId)
      .single();

    if (!existingProfile) {
      throw new NotFoundError('Profile not found');
    }

    if (existingProfile.is_deleted) {
      throw new ValidationError('Profile is already deleted');
    }

    const account = await this.getUserAccount(userId);

    // Check if this is the primary profile
    const { data: settings } = await this.supabaseAdmin
      .from('account_settings')
      .select('primary_profile')
      .eq('account_id', account.account_id)
      .single();

    if (settings?.primary_profile === profileId) {
      throw new ValidationError('Cannot delete primary profile');
    }

    // Soft delete profile
    await this.executeQuery<null>(
      async () => this.supabaseAdmin
        .from('profiles')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('profile_id', profileId),
      'soft delete profile'
    );

    this.logAction('Profile soft deleted', userId, { profileId });
  }

  /**
   * Get primary profile for user
   */
  async getPrimaryProfile(userId: string): Promise<ProfileResponseDto | null> {
    const account = await this.getUserAccount(userId);

    const { data: settings } = await this.supabaseAdmin
      .from('account_settings')
      .select('primary_profile')
      .eq('account_id', account.account_id)
      .single();

    if (!settings?.primary_profile) {
      return null;
    }

    return this.getProfileById(userId, settings.primary_profile);
  }

  // Private helper methods
  private validateCreateProfileData(data: CreateProfileDto): void {
    if (!data.firstname?.trim()) {
      throw new ValidationError('First name is required', 'firstname');
    }

    if (!data.gender) {
      throw new ValidationError('Gender is required', 'gender');
    }

    // Birth details are now mandatory
    if (!data.date_of_birth?.trim()) {
      throw new ValidationError('Date of birth is required', 'date_of_birth');
    }

    if (!data.time_of_birth?.trim()) {
      throw new ValidationError('Time of birth is required', 'time_of_birth');
    }

    if (!data.place_of_birth?.trim()) {
      throw new ValidationError('Place of birth is required', 'place_of_birth');
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date_of_birth)) {
      throw new ValidationError('Date of birth must be in YYYY-MM-DD format', 'date_of_birth');
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(data.time_of_birth)) {
      throw new ValidationError('Time of birth must be in HH:MM format', 'time_of_birth');
    }

    // Validate date is not in the future
    const birthDate = new Date(data.date_of_birth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (birthDate > today) {
      throw new ValidationError('Date of birth cannot be in the future', 'date_of_birth');
    }

    // Validate date is not too far in the past (reasonable limit)
    const minDate = new Date('1900-01-01');
    if (birthDate < minDate) {
      throw new ValidationError('Date of birth cannot be before 1900', 'date_of_birth');
    }
  }

  private validateUpdateProfileData(data: UpdateProfileDto): void {
    if (data.firstname !== undefined && !data.firstname?.trim()) {
      throw new ValidationError('First name cannot be empty', 'firstname');
    }

    // Validate birth details if being updated
    if (data.date_of_birth !== undefined) {
      if (!data.date_of_birth?.trim()) {
        throw new ValidationError('Date of birth cannot be empty', 'date_of_birth');
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.date_of_birth)) {
        throw new ValidationError('Date of birth must be in YYYY-MM-DD format', 'date_of_birth');
      }

      // Validate date is not in the future
      const birthDate = new Date(data.date_of_birth);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (birthDate > today) {
        throw new ValidationError('Date of birth cannot be in the future', 'date_of_birth');
      }

      // Validate date is not too far in the past (reasonable limit)
      const minDate = new Date('1900-01-01');
      if (birthDate < minDate) {
        throw new ValidationError('Date of birth cannot be before 1900', 'date_of_birth');
      }
    }

    if (data.time_of_birth !== undefined) {
      if (!data.time_of_birth?.trim()) {
        throw new ValidationError('Time of birth cannot be empty', 'time_of_birth');
      }

      // Validate time format
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(data.time_of_birth)) {
        throw new ValidationError('Time of birth must be in HH:MM format', 'time_of_birth');
      }
    }

    if (data.place_of_birth !== undefined && !data.place_of_birth?.trim()) {
      throw new ValidationError('Place of birth cannot be empty', 'place_of_birth');
    }
  }


  private async calculateAstrologyData(userId: string, profileData: CreateProfileDto): Promise<any> {
    try {
      // Get user's astrology system preference from account settings
      const accountSettings = await accountSettingsService.getAccountSettings(userId);
      const primarySystem = accountSettings.astrology_system || 'VEDIC';

      const birthDate = new Date(profileData.date_of_birth!);
      const [hours, minutes] = profileData.time_of_birth!.split(':').map(Number);
      const birthTime = new Date();
      birthTime.setHours(hours, minutes, 0, 0);

      // Always calculate both systems but prioritize user's preference
      const [vedicCalculations, westernCalculations] = await Promise.all([
        vedicAstrologyService.calculateVedicAstrology({
          date: birthDate,
          time: birthTime,
          place: profileData.place_of_birth!
        }),
        westernAstrologyService.calculateWesternAstrology({
          date: birthDate,
          time: birthTime,
          place: profileData.place_of_birth!
        })
      ]);

      logger.info('Astrology calculations completed for profile creation', {
        userId,
        primarySystem,
        place: profileData.place_of_birth,
        vedic: {
          rasi: vedicCalculations.rasi,
          nakshatra: vedicCalculations.nakshatra,
          lagna: vedicCalculations.lagna
        },
        western: {
          sunSign: westernCalculations.sunSign,
          moonSign: westernCalculations.moonSign,
          ascendant: westernCalculations.ascendant
        }
      });

      return {
        vedic: vedicCalculations,
        western: westernCalculations
      };
    } catch (error) {
      logger.error('Astrology calculation failed', { userId, error });
      throw new ValidationError('Failed to calculate astrology data');
    }
  }

  private logAction(action: string, userId: string, details?: any): void {
    logger.info(`ProfileService: ${action}`, {
      action,
      userId,
      service: 'ProfileService',
      ...details,
      timestamp: new Date().toISOString()
    });
  }
}

export const profileService = new ProfileService();