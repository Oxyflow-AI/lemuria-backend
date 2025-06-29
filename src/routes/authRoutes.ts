import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Auth routes
router.post('/signup', authController.createHandler(authController.signUp.bind(authController)));
router.post('/signin', authController.createHandler(authController.signIn.bind(authController)));
router.post('/signout', authenticate, authController.createHandler(authController.signOut.bind(authController)));
router.post('/refresh', authController.createHandler(authController.refreshToken.bind(authController)));
router.post('/reset-password', authController.createHandler(authController.requestPasswordReset.bind(authController)));
router.get('/status', authController.createHandler(authController.checkEmailStatus.bind(authController)));

export default router;