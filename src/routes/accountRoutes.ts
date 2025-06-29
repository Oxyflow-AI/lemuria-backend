import { Router } from 'express';
import { accountController } from '../controllers/accountController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Account routes
router.get('/', authenticate, accountController.createHandler(accountController.getAccount.bind(accountController)));
router.delete('/', authenticate, accountController.createHandler(accountController.deleteAccount.bind(accountController)));

export default router;