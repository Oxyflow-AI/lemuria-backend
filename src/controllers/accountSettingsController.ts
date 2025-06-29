import { Response } from 'express';
import { BaseController } from './baseController';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { accountSettingsService } from '../services/accountSettingsService';
import { UpdateAccountSettingsDto } from '../types/accountSettingsTypes';
import { ValidationError } from '../utils/errorHandler';

export class AccountSettingsController extends BaseController {
  /**
   * Get account settings
   */
  async getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.getUserId(req);

    this.logAction('Get account settings', userId);

    const settings = await accountSettingsService.getAccountSettings(userId);
    this.sendSuccess(res, settings);
  }

  /**
   * Update account settings
   */
  async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    const updateData: UpdateAccountSettingsDto = req.body;

    this.logAction('Update account settings', userId, { 
      updatedFields: Object.keys(updateData) 
    });

    const settings = await accountSettingsService.updateAccountSettings(userId, updateData);
    this.sendSuccess(res, settings);
  }

  // Account settings controller doesn't follow standard CRUD since it's 1:1 with accounts
  async getAll(): Promise<never> {
    throw new ValidationError('Operation not supported for account settings');
  }

  async getById(): Promise<never> {
    throw new ValidationError('Use getSettings instead');
  }

  async create(): Promise<never> {
    throw new ValidationError('Settings are created automatically with accounts');
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    return this.updateSettings(req, res);
  }

  async delete(): Promise<never> {
    throw new ValidationError('Operation not supported for account settings');
  }
}

export const accountSettingsController = new AccountSettingsController();