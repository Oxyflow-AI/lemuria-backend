import express from 'express';
import path from 'path';
import { securityMiddleware, corsMiddleware, rateLimitMiddleware } from './middleware/security';
import { routes } from './routes';
import { logger } from './utils/logger';
import { handleError, createErrorResponse } from './utils/errorHandler';
import { ErrorCode } from './types/errorCodes';

const app = express();

// Security middleware
app.use(securityMiddleware);
app.use(corsMiddleware);
app.use(rateLimitMiddleware);

// Logging middleware
app.use((req, res, next) => {
  console.log('Origin:', req.headers.origin);
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static('public', {
  setHeaders: (res, path) => {
      if (path.endsWith('.js')) {
          res.setHeader('Content-Type', 'text/javascript');
      }
  }
}));

// Serve template files for email verification and auth callbacks
app.use(express.static(path.join(__dirname, 'templates'), {
  setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
          res.setHeader('Content-Type', 'text/html');
      }
  }
}));

// Logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Auth callback route (serves the callback HTML page)
app.get('/auth/callback', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates/auth-callback.html'));
});

// Email verification page
app.get('/email-verification', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates/email-verification.html'));
});

// Routes
app.use(routes);

// 404 handler
app.use('*', (req, res) => {
  const response = createErrorResponse(
    ErrorCode.RESOURCE_NOT_FOUND,
    `Route ${req.method} ${req.originalUrl} not found`
  );
  res.status(404).json(response);
});

// Global error handler (must be last)
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  handleError(error, res, `${req.method} ${req.originalUrl}`);
});

export { app };