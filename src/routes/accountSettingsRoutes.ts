import { Router } from 'express';
import { accountSettingsController } from '../controllers/accountSettingsController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Account settings routes
router.get('/', authenticate, accountSettingsController.createHandler(accountSettingsController.getSettings.bind(accountSettingsController)));
router.put('/', authenticate, accountSettingsController.createHandler(accountSettingsController.updateSettings.bind(accountSettingsController)));

export default router;