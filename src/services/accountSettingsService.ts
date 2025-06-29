import { BaseService } from './baseService';
import { 
  AccountSettings,
  CreateAccountSettingsDto,
  UpdateAccountSettingsDto,
  AccountSettingsResponseDto
} from '../types/accountSettingsTypes';
import { QueryOptions } from '../types/baseTypes';
import { logger } from '../utils/logger';
import { ValidationError, NotFoundError } from '../utils/errorHandler';

export class AccountSettingsService extends BaseService {
  /**
   * Get account settings for user
   */
  async getAccountSettings(userId: string): Promise<AccountSettingsResponseDto> {
    const account = await this.getUserAccount(userId);

    const settings = await this.executeQuery<AccountSettings>(
      async () => this.supabaseAdmin
        .from('account_settings')
        .select('*')
        .eq('account_id', account.account_id)
        .single(),
      'get account settings'
    );

    return settings as AccountSettingsResponseDto;
  }

  /**
   * Update account settings
   */
  async updateAccountSettings(
    userId: string,
    updateData: UpdateAccountSettingsDto
  ): Promise<AccountSettingsResponseDto> {
    this.validateUpdateData(updateData);
    
    const account = await this.getUserAccount(userId);

    // If updating primary_profile, validate it belongs to the account
    if (updateData.primary_profile !== undefined) {
      await this.validatePrimaryProfile(account.account_id, updateData.primary_profile);
    }

    const settings = await this.executeQuery<AccountSettings>(
      async () => this.supabaseAdmin
        .from('account_settings')
        .update(updateData)
        .eq('account_id', account.account_id)
        .select()
        .single(),
      'update account settings'
    );

    this.logAction('Account settings updated', userId, { 
      updatedFields: Object.keys(updateData) 
    });

    return settings as AccountSettingsResponseDto;
  }

  /**
   * Create default account settings
   */
  async createDefaultSettings(accountId: number): Promise<AccountSettingsResponseDto> {
    const defaultSettings: CreateAccountSettingsDto = {
      account_id: accountId,
      preferred_language: 'ENGLISH',
      astrology_system: 'VEDIC',
      timezone: 'UTC',
      notification_preferences: {},
      theme: 'light'
    };

    const settings = await this.executeQuery<AccountSettings>(
      async () => this.supabaseAdmin
        .from('account_settings')
        .insert(defaultSettings)
        .select()
        .single(),
      'create default account settings'
    );

    return settings as AccountSettingsResponseDto;
  }

  // Since account settings is a 1:1 relationship with accounts,
  // we don't need getAll, getById, or delete methods
  async getAll(): Promise<never> {
    throw new ValidationError('Operation not supported for account settings');
  }

  async getById(): Promise<never> {
    throw new ValidationError('Operation not supported for account settings');
  }

  async create(): Promise<never> {
    throw new ValidationError('Use createDefaultSettings instead');
  }

  async delete(): Promise<never> {
    throw new ValidationError('Operation not supported for account settings');
  }

  // Private helper methods
  private validateUpdateData(data: UpdateAccountSettingsDto): void {
    // Add specific validation rules for account settings
    if (data.timezone && typeof data.timezone !== 'string') {
      throw new ValidationError('Timezone must be a string', 'timezone');
    }

    if (data.notification_preferences && typeof data.notification_preferences !== 'object') {
      throw new ValidationError('Notification preferences must be an object', 'notification_preferences');
    }
  }

  private async validatePrimaryProfile(accountId: number, profileId: number | null): Promise<void> {
    if (profileId === null) {
      return; // Allow setting to null
    }

    const { data: membership } = await this.supabaseAdmin
      .from('account_membership')
      .select('profile_id')
      .eq('account_id', accountId)
      .eq('profile_id', profileId)
      .single();

    if (!membership) {
      throw new ValidationError('Primary profile must belong to the account');
    }
  }

  private logAction(action: string, userId: string, details?: any): void {
    logger.info(`AccountSettingsService: ${action}`, {
      action,
      userId,
      service: 'AccountSettingsService',
      ...details,
      timestamp: new Date().toISOString()
    });
  }
}

export const accountSettingsService = new AccountSettingsService();