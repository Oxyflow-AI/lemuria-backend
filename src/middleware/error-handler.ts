import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { createErrorResponse, AppError } from '../utils/errorHandler';
import { ErrorCode } from '../types/errorCodes';

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  const errorCode = err.code;

  logger.error('Error occurred', {
    error: err.message,
    errorCode,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  if (process.env.NODE_ENV === 'production') {
    // In production, only show generic error messages for non-operational errors
    if (statusCode >= 500) {
      message = 'Something went wrong';
    }
  }

  res.status(statusCode).json(createErrorResponse(errorCode, message));
};

export const notFoundHandler = (req: Request, res: Response) => {
  const message = `Route ${req.originalUrl} not found`;
  logger.warn('Route not found', { url: req.originalUrl, method: req.method });
  res.status(404).json(createErrorResponse(ErrorCode.RESOURCE_NOT_FOUND, message));
};