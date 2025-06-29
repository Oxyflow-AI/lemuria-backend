import { Router } from 'express';
import { Request, Response } from 'express';
import { createSuccessResponse } from '../utils/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// Health check endpoint
router.get('/', (req: Request, res: Response) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  };

  logger.info('Health check requested', healthCheck);
  
  res.status(200).json(createSuccessResponse(healthCheck));
});

export default router;