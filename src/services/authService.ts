import { BaseService } from './baseService';
import { 
  SignUpDto,
  SignInDto,
  AuthResponseDto,
  RefreshTokenDto
} from '../types/authTypes';
import { accountService } from './accountService';
import { logger } from '../utils/logger';
import { 
  ValidationError, 
  UnauthorizedError, 
  ConflictError,
  DatabaseError 
} from '../utils/errorHandler';
import { ErrorCode } from '../types/errorCodes';

export class AuthService extends BaseService {
  /**
   * Sign up new user
   */
  async signUp(signUpData: SignUpDto): Promise<{
    message: string;
    email: string;
    requiresEmailVerification: boolean;
    isNewUser: string;
    userId: string;
  }> {
    this.validateSignUpData(signUpData);

    try {
      // Check if email already exists and is verified
      const emailStatus = await this.getUserEmailVerificationStatus(signUpData.email);
      
      if (emailStatus.exists && emailStatus.verified) {
        throw new ConflictError('An account with this email already exists and is verified');
      }

      const { data, error } = await this.supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            full_name: signUpData.full_name
          },
          emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/email-verification?email=${encodeURIComponent(signUpData.email)}`
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          throw new ConflictError('Email already exists');
        }
        throw new ValidationError(error.message);
      }

      if (!data.user) {
        throw new DatabaseError('Failed to create user');
      }

      return {
        message: 'Account created successfully! Please check your email and click the verification link to activate your account.',
        email: signUpData.email,
        requiresEmailVerification: true,
        isNewUser: data.user.created_at,
        userId: data.user.id
      };

    } catch (error) {
      if (error instanceof ValidationError || error instanceof ConflictError) {
        throw error;
      }
      
      logger.error('Sign up failed', { 
        error: error instanceof Error ? error.message : error,
        email: signUpData.email
      });
      throw new DatabaseError('Sign up failed');
    }
  }

  /**
   * Sign in user
   */
  async signIn(signInData: SignInDto): Promise<AuthResponseDto> {
    this.validateSignInData(signInData);

    try {
      // Check email verification status before authentication
      const emailStatus = await this.getUserEmailVerificationStatus(signInData.email);
      
      // If user exists but email is not verified, return verification error regardless of password
      if (emailStatus.exists && !emailStatus.verified) {
        throw new ValidationError(
          'Please confirm your email address before signing in',
          undefined,
          { 
            code: ErrorCode.EMAIL_NOT_VERIFIED,
            provider: 'email',
            suggestedAction: 'Check your email for the confirmation link'
          }
        );
      }

      // Proceed with normal sign in
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new UnauthorizedError('Invalid email or password');
        }
        if (error.message.includes('Email not confirmed')) {
          throw new ValidationError(
            'Please confirm your email address before signing in',
            undefined,
            { 
              code: ErrorCode.EMAIL_NOT_VERIFIED,
              provider: 'email',
              suggestedAction: 'Check your email for the confirmation link'
            }
          );
        }
        throw new ValidationError(error.message);
      }

      if (!data.user || !data.session) {
        throw new UnauthorizedError('Sign in failed');
      }

      // Ensure user has an account in our system
      try {
        await accountService.getOrCreateAccount(data.user.id);
      } catch (accountError) {
        logger.error('Failed to get/create account during sign in', {
          userId: data.user.id,
          error: accountError instanceof Error ? accountError.message : accountError
        });
      }


      return {
        user: {
          id: data.user.id,
          email: data.user.email!,
          email_confirmed_at: data.user.email_confirmed_at || null,
          created_at: data.user.created_at || '',
          updated_at: data.user.updated_at || ''
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at!,
          token_type: data.session.token_type
        },
        message: 'Signed in successfully!'
      };

    } catch (error) {
      if (error instanceof ValidationError || error instanceof UnauthorizedError) {
        throw error;
      }
      
      logger.error('Sign in failed', { 
        error: error instanceof Error ? error.message : error,
        email: signInData.email
      });
      throw new DatabaseError('Sign in failed');
    }
  }

  /**
   * Sign out user
   */
  async signOut(_accessToken: string): Promise<{ message: string }> {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        logger.error('Sign out failed', { error: error.message });
        // Don't throw error for sign out failures
      }


      return { message: 'Signed out successfully' };

    } catch (error) {
      logger.error('Sign out error', { 
        error: error instanceof Error ? error.message : error
      });
      // Return success even if there's an error
      return { message: 'Signed out successfully' };
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshData: RefreshTokenDto): Promise<AuthResponseDto> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession({
        refresh_token: refreshData.refresh_token
      });

      if (error) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      if (!data.user || !data.session) {
        throw new UnauthorizedError('Token refresh failed');
      }


      return {
        user: {
          id: data.user.id,
          email: data.user.email!,
          email_confirmed_at: data.user.email_confirmed_at || null,
          created_at: data.user.created_at || '',
          updated_at: data.user.updated_at || ''
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at!,
          token_type: data.session.token_type
        },
        message: 'Token refreshed successfully!'
      };

    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      
      logger.error('Token refresh failed', { 
        error: error instanceof Error ? error.message : error
      });
      throw new DatabaseError('Token refresh failed');
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    if (!email || !this.isValidEmail(email)) {
      throw new ValidationError('Valid email address is required', 'email');
    }

    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email);

      if (error) {
        logger.error('Password reset request failed', { 
          error: error.message,
          email
        });
        // Don't reveal if email exists or not
      }


      return { 
        message: 'If an account with that email exists, you will receive a password reset link.' 
      };

    } catch (error) {
      logger.error('Password reset error', { 
        error: error instanceof Error ? error.message : error,
        email
      });
      // Always return success message for security
      return { 
        message: 'If an account with that email exists, you will receive a password reset link.' 
      };
    }
  }

  /**
   * Private helper method to get user email verification status
   */
  private async getUserEmailVerificationStatus(email: string): Promise<{
    exists: boolean;
    verified: boolean;
    userId?: string;
  }> {
    try {
      // Use admin API to find user by email
      const { data: adminData, error: adminError } = await this.supabaseAdmin.auth.admin.listUsers();
      
      if (adminError) {
        throw new DatabaseError('Failed to check user verification status');
      }

      if (adminData && adminData.users) {
        const existingUser = adminData.users.find(user => user.email === email);
        
        if (existingUser) {
          return {
            exists: true,
            verified: !!existingUser.email_confirmed_at,
            userId: existingUser.id
          };
        }
      }

      // User not found
      return {
        exists: false,
        verified: false
      };

    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError('User verification status check failed');
    }
  }

  /**
   * Check email verification status
   */
  async checkEmailStatus(email: string): Promise<{
    exists: boolean;
    verified: boolean;
    message: string;
  }> {
    if (!email || !this.isValidEmail(email)) {
      throw new ValidationError('Valid email address is required', 'email');
    }

    try {
      const status = await this.getUserEmailVerificationStatus(email);
      

      if (status.exists) {
        return {
          exists: true,
          verified: status.verified,
          message: status.verified 
            ? 'Email is verified' 
            : 'Email exists but is not verified'
        };
      } else {
        return {
          exists: false,
          verified: false,
          message: 'Email not found'
        };
      }

    } catch (error) {
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError('Email status check failed');
    }
  }

  // Auth service doesn't follow standard CRUD pattern
  async getAll(): Promise<never> {
    throw new ValidationError('Operation not supported for auth service');
  }

  async getById(): Promise<never> {
    throw new ValidationError('Operation not supported for auth service');
  }

  async create(): Promise<never> {
    throw new ValidationError('Use signUp instead');
  }

  async update(): Promise<never> {
    throw new ValidationError('Operation not supported for auth service');
  }

  async delete(): Promise<never> {
    throw new ValidationError('Operation not supported for auth service');
  }

  // Private helper methods
  private validateSignUpData(data: SignUpDto): void {
    if (!data.email || !this.isValidEmail(data.email)) {
      throw new ValidationError('Valid email address is required', 'email');
    }

    if (!data.password || data.password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long', 'password');
    }

    if (data.full_name && data.full_name.length > 255) {
      throw new ValidationError('Full name is too long (max 255 characters)', 'full_name');
    }
  }

  private validateSignInData(data: SignInDto): void {
    if (!data.email || !this.isValidEmail(data.email)) {
      throw new ValidationError('Valid email address is required', 'email');
    }

    if (!data.password) {
      throw new ValidationError('Password is required', 'password');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private logAction(action: string, userId: string, details?: any): void {
    logger.info(`AuthService: ${action}`, {
      action,
      userId,
      service: 'AuthService',
      ...details,
      timestamp: new Date().toISOString()
    });
  }
}

export const authService = new AuthService();