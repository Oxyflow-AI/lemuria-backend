import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { createSuccessResponse, asyncHandler, ValidationError } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { PaginationOptions, QueryOptions } from '../types/baseTypes';

/**
 * Abstract base controller providing common functionality for all controllers
 * Includes standardized response handling, validation, and error management
 */
export abstract class BaseController {
  /**
   * Extract and validate user ID from authenticated request
   * @param req Authenticated request object
   * @returns User ID string
   * @throws ValidationError if user ID is missing
   */
  protected getUserId(req: AuthenticatedRequest): string {
    const userId = req.userId;
    if (!userId) {
      throw new ValidationError('User ID not found in request');
    }
    return userId;
  }

  /**
   * Extract and validate pagination options from query parameters
   * @param req Express request object
   * @returns Validated pagination options with safe defaults
   */
  protected getPaginationOptions(req: Request): PaginationOptions {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    return {
      limit: Math.min(Math.max(limit, 1), 100), // Ensure limit is between 1-100
      offset: Math.max(offset, 0) // Ensure offset is non-negative
    };
  }

  /**
   * Extract and validate query parameters for pagination and sorting
   * @param req Express request object
   * @returns Validated query options including pagination and sorting
   */
  protected getQueryOptions(req: Request): QueryOptions {
    const pagination = this.getPaginationOptions(req);
    const sortBy = req.query.sortBy as string;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc';

    return {
      ...pagination,
      sortBy,
      sortOrder
    };
  }

  /**
   * Extract and validate numeric ID parameter from request
   * @param req Express request object
   * @param paramName Name of the parameter to extract (default: 'id')
   * @returns Validated positive integer ID
   * @throws ValidationError if ID is invalid
   */
  protected getIdParam(req: Request, paramName: string = 'id'): number {
    const id = parseInt(req.params[paramName]);
    if (isNaN(id) || id <= 0) {
      throw new ValidationError(`Invalid ${paramName}: must be a positive number`);
    }
    return id;
  }

  /**
   * Send standardized success response
   * @param res Express response object
   * @param data Response data payload
   * @param statusCode HTTP status code (default: 200)
   */
  protected sendSuccess<T>(res: Response, data: T, statusCode: number = 200): void {
    res.status(statusCode).json(createSuccessResponse(data));
  }

  /**
   * Create async error handler wrapper for route handlers
   * Automatically catches and handles errors from async route functions
   * @param fn Async route handler function
   * @returns Wrapped handler with error management
   */
  public createHandler(fn: (req: AuthenticatedRequest, res: Response) => Promise<void>) {
    return asyncHandler(fn);
  }

  /**
   * Log controller actions for monitoring and debugging
   * @param action Description of the action being performed
   * @param userId User ID performing the action (optional)
   * @param details Additional context details
   */
  protected logAction(action: string, userId?: string, details?: any): void {
    logger.info(`Controller: ${action}`, {
      action,
      userId,
      controller: this.constructor.name,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  // Abstract CRUD methods that concrete controllers must implement
  abstract getAll(req: AuthenticatedRequest, res: Response): Promise<void>;
  abstract getById(req: AuthenticatedRequest, res: Response): Promise<void>;
  abstract create(req: AuthenticatedRequest, res: Response): Promise<void>;
  abstract update(req: AuthenticatedRequest, res: Response): Promise<void>;
  abstract delete(req: AuthenticatedRequest, res: Response): Promise<void>;
}