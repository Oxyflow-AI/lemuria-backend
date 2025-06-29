import { Response } from 'express';
import { BaseController } from './baseController';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { accountService } from '../services/accountService';
import { ValidationError } from '../utils/errorHandler';

export class AccountController extends BaseController {
  /**
   * Get user's account
   */
  async getAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.getUserId(req);

    this.logAction('Get account', userId);

    const account = await accountService.getAccountByUserId(userId);
    this.sendSuccess(res, account);
  }

  /**
   * Delete user's account
   */
  async deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.getUserId(req);

    this.logAction('Delete account', userId);

    await accountService.deleteAccount(userId);
    this.sendSuccess(res, { message: 'Account deleted successfully' });
  }

  // Account controller doesn't follow standard CRUD since users have only one account
  async getAll(): Promise<never> {
    throw new ValidationError('Operation not supported - users have only one account');
  }

  async getById(): Promise<never> {
    throw new ValidationError('Use getAccount instead');
  }

  async create(): Promise<never> {
    throw new ValidationError('Accounts are created automatically during registration');
  }

  async update(): Promise<never> {
    throw new ValidationError('Accounts cannot be updated directly');
  }

  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    return this.deleteAccount(req, res);
  }
}

export const accountController = new AccountController();