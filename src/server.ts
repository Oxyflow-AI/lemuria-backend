// Load environment variables first
const dotenv = require('dotenv');
dotenv.config();

import { app } from './app';
import { config, validateConfig } from './config/app.config';
import { initializeSupabase } from './config/database';
import { logger } from './utils/logger';
import * as fs from 'fs';
import * as path from 'path';

// Validate configuration after dotenv is loaded
validateConfig();

// Initialize Supabase
try {
  initializeSupabase();
  logger.info('Supabase initialized successfully');
} catch (error) {
  logger.error('Failed to initialize Supabase', { 
    error: error instanceof Error ? error.message : error 
  });
  process.exit(1);
}

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const server = app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully`);
  
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not gracefully shutdown, forcing exit');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export { server };