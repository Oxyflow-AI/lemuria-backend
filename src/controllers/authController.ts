import { Request, Response } from 'express';
import { BaseController } from './baseController';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { authService } from '../services/authService';
import { SignUpDto, SignInDto, RefreshTokenDto } from '../types/authTypes';
import { ValidationError } from '../utils/errorHandler';

export class AuthController extends BaseController {
  /**
   * Sign up new user
   */
  async signUp(req: Request, res: Response): Promise<void> {
    const signUpData: SignUpDto = req.body;


    const result = await authService.signUp(signUpData);
    this.sendSuccess(res, result, 201);
  }

  /**
   * Sign in user
   */
  async signIn(req: Request, res: Response): Promise<void> {
    const signInData: SignInDto = req.body;


    const result = await authService.signIn(signInData);
    this.sendSuccess(res, result);
  }

  /**
   * Sign out user
   */
  async signOut(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    const accessToken = req.accessToken || '';


    const result = await authService.signOut(accessToken);
    this.sendSuccess(res, result);
  }

  /**
   * Refresh token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    const refreshData: RefreshTokenDto = req.body;


    const result = await authService.refreshToken(refreshData);
    this.sendSuccess(res, result);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    const { email } = req.body;


    const result = await authService.requestPasswordReset(email);
    this.sendSuccess(res, result);
  }

  /**
   * Check email verification status
   */
  async checkEmailStatus(req: Request, res: Response): Promise<void> {
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      throw new ValidationError('Email parameter is required');
    }


    const result = await authService.checkEmailStatus(email);
    this.sendSuccess(res, result);
  }

  // Auth controller doesn't follow standard CRUD pattern
  async getAll(): Promise<never> {
    throw new ValidationError('Operation not supported for auth controller');
  }

  async getById(): Promise<never> {
    throw new ValidationError('Operation not supported for auth controller');
  }

  async create(req: Request, res: Response): Promise<void> {
    return this.signUp(req, res);
  }

  async update(): Promise<never> {
    throw new ValidationError('Operation not supported for auth controller');
  }

  async delete(): Promise<never> {
    throw new ValidationError('Operation not supported for auth controller');
  }
}

export const authController = new AuthController();