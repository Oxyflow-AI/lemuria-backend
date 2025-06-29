import { Router } from 'express';
import { vedicChatController } from '../controllers/VedicChatController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Vedic Chat routes
router.get('/history', authenticate, vedicChatController.createHandler(vedicChatController.getChatHistory.bind(vedicChatController)));
router.get('/messages', authenticate, vedicChatController.createHandler(vedicChatController.getAll.bind(vedicChatController)));
router.get('/messages/:messageId', authenticate, vedicChatController.createHandler(vedicChatController.getById.bind(vedicChatController)));
router.post('/', authenticate, vedicChatController.createHandler(vedicChatController.create.bind(vedicChatController)));
router.post('/send', authenticate, vedicChatController.createHandler(vedicChatController.sendMessage.bind(vedicChatController)));
router.put('/messages/:messageId', authenticate, vedicChatController.createHandler(vedicChatController.update.bind(vedicChatController)));
router.delete('/messages/:messageId', authenticate, vedicChatController.createHandler(vedicChatController.delete.bind(vedicChatController)));

export default router;