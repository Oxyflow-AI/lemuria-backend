import { BaseService } from './baseService';
import { 
  Account,
  CreateAccountDto,
  UpdateAccountDto,
  AccountResponseDto
} from '../types/accountTypes';
import { accountSettingsService } from './accountSettingsService';
import { logger } from '../utils/logger';
import { ValidationError, ConflictError } from '../utils/errorHandler';

export class AccountService extends BaseService {
  /**
   * Get account for user (users only have one account)
   */
  async getAccountByUserId(userId: string): Promise<AccountResponseDto> {
    this.validateUserAccess(userId);

    const account = await this.executeQuery<Account>(
      async () => this.supabaseAdmin
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .single(),
      'get account by user ID'
    );

    return account as AccountResponseDto;
  }

  /**
   * Create account for user
   */
  async createAccount(userId: string): Promise<AccountResponseDto> {
    this.validateUserAccess(userId);

    // Check if account already exists
    const { data: existingAccount } = await this.supabaseAdmin
      .from('accounts')
      .select('account_id')
      .eq('user_id', userId)
      .single();

    if (existingAccount) {
      throw new ConflictError('Account already exists for this user');
    }

    // Create account
    const account = await this.executeQuery<Account>(
      async () => this.supabaseAdmin
        .from('accounts')
        .insert({ user_id: userId })
        .select()
        .single(),
      'create account'
    );

    // Create default account settings
    try {
      await accountSettingsService.createDefaultSettings((account as Account).account_id);
    } catch (error) {
      logger.warn('Failed to create default account settings', {
        userId,
        accountId: (account as Account).account_id,
        error: error instanceof Error ? error.message : error
      });
    }

    this.logAction('Account created', userId, { accountId: (account as Account).account_id });

    return account as AccountResponseDto;
  }

  /**
   * Get or create account for user
   */
  async getOrCreateAccount(userId: string): Promise<AccountResponseDto> {
    try {
      return await this.getAccountByUserId(userId);
    } catch (error) {
      // If account doesn't exist, create it
      return await this.createAccount(userId);
    }
  }

  /**
   * Delete account (soft delete - mark as inactive)
   */
  async deleteAccount(userId: string): Promise<void> {
    const account = await this.getUserAccount(userId);

    // Note: In a production system, you might want to soft delete
    // or have additional cleanup logic for profiles, chat history, etc.
    await this.executeQuery<null>(
      async () => this.supabaseAdmin
        .from('accounts')
        .delete()
        .eq('account_id', account.account_id),
      'delete account'
    );

    this.logAction('Account deleted', userId, { accountId: account.account_id });
  }

  // Account service doesn't need traditional CRUD operations since users have only one account
  async getAll(): Promise<never> {
    throw new ValidationError('Operation not supported - users have only one account');
  }

  async getById(): Promise<never> {
    throw new ValidationError('Use getAccountByUserId instead');
  }

  async create(): Promise<never> {
    throw new ValidationError('Use createAccount with userId instead');
  }

  async update(): Promise<never> {
    throw new ValidationError('Accounts cannot be updated directly');
  }

  async delete(): Promise<never> {
    throw new ValidationError('Use deleteAccount with userId instead');
  }

  private logAction(action: string, userId: string, details?: any): void {
    logger.info(`AccountService: ${action}`, {
      action,
      userId,
      service: 'AccountService',
      ...details,
      timestamp: new Date().toISOString()
    });
  }
}

export const accountService = new AccountService();