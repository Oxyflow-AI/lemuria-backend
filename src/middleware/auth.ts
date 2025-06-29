import { Request, Response, NextFunction } from 'express';
import { getSupabaseClient } from '../config/database';
import { logger } from '../utils/logger';
import { createErrorResponse } from '../utils/errorHandler';
import { ErrorCode } from '../types/errorCodes';
import { User } from '@supabase/supabase-js';

export interface AuthenticatedRequest extends Request {
  user?: User;
  userId?: string;
  accessToken?: string;
}

export const authenticate = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid authorization header', { 
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.status(401).json(createErrorResponse(ErrorCode.AUTHENTICATION_REQUIRED, 'Authentication required'));
      return;
    }

    const token = authHeader.substring(7);
    const supabase = getSupabaseClient();

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn('Invalid authentication token', { 
        error: error?.message,
        ip: req.ip
      });
      
      res.status(401).json(createErrorResponse(ErrorCode.INVALID_TOKEN, 'Invalid or expired token'));
      return;
    }

    req.user = user;
    req.userId = user.id;
    req.accessToken = token;

    logger.info('User authenticated successfully', { 
      userId: user.id,
      email: user.email,
      endpoint: req.originalUrl
    });

    next();
  } catch (error) {
    logger.error('Authentication middleware error', { 
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    res.status(500).json(createErrorResponse(ErrorCode.SERVICE_UNAVAILABLE, 'Authentication service unavailable'));
  }
};

