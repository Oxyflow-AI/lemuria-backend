import { Router } from 'express';
import authRoutes from './authRoutes';
import accountRoutes from './accountRoutes';
import profileRoutes from './profileRoutes';
import accountSettingsRoutes from './accountSettingsRoutes';
import chatRoutes from './chatRoutes';
import vedicChatRoutes from './vedicChatRoutes';
import westernChatRoutes from './westernChatRoutes';
import healthRoutes from './healthRoutes';

const router = Router();

// API routes with consistent naming and clear structure
router.use('/api/auth', authRoutes);
router.use('/api/account', accountRoutes);
router.use('/api/profiles', profileRoutes);
router.use('/api/account-settings', accountSettingsRoutes);

// Unified chat endpoint (determines system from user's account settings)
router.use('/api/chat', chatRoutes);

// Legacy system-specific endpoints (maintained for backward compatibility)
router.use('/api/vedic-chat', vedicChatRoutes);
router.use('/api/western-chat', westernChatRoutes);

router.use('/api/health', healthRoutes);

export { router as routes };