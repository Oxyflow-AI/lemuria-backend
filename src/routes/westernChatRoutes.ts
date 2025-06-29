import { Router } from 'express';
import { westernChatController } from '../controllers/WesternChatController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Western Chat routes
router.get('/history', authenticate, westernChatController.createHandler(westernChatController.getChatHistory.bind(westernChatController)));
router.get('/messages', authenticate, westernChatController.createHandler(westernChatController.getAll.bind(westernChatController)));
router.get('/messages/:messageId', authenticate, westernChatController.createHandler(westernChatController.getById.bind(westernChatController)));
router.post('/', authenticate, westernChatController.createHandler(westernChatController.create.bind(westernChatController)));
router.post('/send', authenticate, westernChatController.createHandler(westernChatController.sendMessage.bind(westernChatController)));
router.put('/messages/:messageId', authenticate, westernChatController.createHandler(westernChatController.update.bind(westernChatController)));
router.delete('/messages/:messageId', authenticate, westernChatController.createHandler(westernChatController.delete.bind(westernChatController)));

export default router;