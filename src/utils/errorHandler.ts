import { Response } from 'express';
import { logger } from './logger';
import { ErrorCode, ApiError, ApiResponse } from '../types/errorCodes';

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number = 500,
    public details?: any,
    public field?: string
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string, details?: any) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details, field);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(ErrorCode.RESOURCE_NOT_FOUND, message, 404, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required', details?: any) {
    super(ErrorCode.AUTHENTICATION_REQUIRED, message, 401, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied', details?: any) {
    super(ErrorCode.FORBIDDEN, message, 403, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists', details?: any) {
    super(ErrorCode.RESOURCE_ALREADY_EXISTS, message, 409, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(ErrorCode.DATABASE_ERROR, message, 500, details);
  }
}

export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
}

export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: any,
  field?: string
): ApiResponse {
  const error: ApiError = {
    code,
    message,
    details,
    field,
    timestamp: new Date().toISOString()
  };

  return {
    success: false,
    error,
    timestamp: new Date().toISOString()
  };
}

export function handleError(error: any, res: Response, context?: string): void {
  const timestamp = new Date().toISOString();
  
  // Log the error
  logger.error('Error occurred', {
    error: error.message || error,
    code: error.code || 'UNKNOWN',
    stack: error.stack,
    context: context || 'Unknown context',
    timestamp
  });

  // Handle different error types
  if (error instanceof AppError) {
    const response = createErrorResponse(error.code, error.message, error.details, error.field);
    res.status(error.statusCode).json(response);
    return;
  }

  // Handle Supabase/Database errors
  if (error.message?.includes('violates row-level security policy')) {
    const response = createErrorResponse(
      ErrorCode.FORBIDDEN,
      'Access denied to this resource'
    );
    res.status(403).json(response);
    return;
  }

  if (error.message?.includes('duplicate key value')) {
    const response = createErrorResponse(
      ErrorCode.RESOURCE_ALREADY_EXISTS,
      'Resource already exists'
    );
    res.status(409).json(response);
    return;
  }

  if (error.message?.includes('not found')) {
    const response = createErrorResponse(
      ErrorCode.RESOURCE_NOT_FOUND,
      'Resource not found'
    );
    res.status(404).json(response);
    return;
  }

  // Handle validation errors
  if (error.details && Array.isArray(error.details)) {
    const response = createErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      error.details
    );
    res.status(400).json(response);
    return;
  }

  // Default internal server error
  const response = createErrorResponse(
    ErrorCode.INTERNAL_SERVER_ERROR,
    'An unexpected error occurred'
  );
  res.status(500).json(response);
}

export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      handleError(error, res, `${req.method} ${req.originalUrl}`);
    });
  };
}