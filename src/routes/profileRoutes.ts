import { Router } from 'express';
import { profileController } from '../controllers/profileController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Profile CRUD routes
router.get('/', authenticate, profileController.createHandler(profileController.getAll.bind(profileController)));
router.get('/primary', authenticate, profileController.createHandler(profileController.getPrimary.bind(profileController)));
router.get('/:profileId', authenticate, profileController.createHandler(profileController.getById.bind(profileController)));
router.post('/', authenticate, profileController.createHandler(profileController.create.bind(profileController)));
router.put('/:profileId', authenticate, profileController.createHandler(profileController.update.bind(profileController)));
router.delete('/:profileId', authenticate, profileController.createHandler(profileController.delete.bind(profileController)));

export default router;