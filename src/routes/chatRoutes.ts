import { Router } from 'express';
import { chatController } from '../controllers/chatController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

/**
 * Unified Chat Routes
 * 
 * These routes automatically determine whether to use Vedic or Western astrology
 * based on the user's account settings. No need for separate endpoints.
 */

// All chat routes require authentication
router.use(authenticate);

/**
 * @route POST /api/chat
 * @desc Send a new chat message (system determined by user's account settings)
 * @body { content: string, profile_id?: number }
 */
router.post('/', chatController.createHandler(chatController.create.bind(chatController)));

/**
 * @route GET /api/chat/history
 * @desc Get chat history (system determined by user's account settings)
 * @query { profile_id?: number, limit?: number, offset?: number, sortBy?: string, sortOrder?: 'asc'|'desc' }
 */
router.get('/history', chatController.createHandler(chatController.getAll.bind(chatController)));

/**
 * @route GET /api/chat/messages/:messageId
 * @desc Get specific message by ID
 * @param messageId - The ID of the message to retrieve
 */
router.get('/messages/:messageId', chatController.createHandler(chatController.getById.bind(chatController)));

/**
 * @route PUT /api/chat/messages/:messageId
 * @desc Update a message (only user messages can be updated)
 * @param messageId - The ID of the message to update
 * @body { content?: string }
 */
router.put('/messages/:messageId', chatController.createHandler(chatController.update.bind(chatController)));

/**
 * @route DELETE /api/chat/messages/:messageId
 * @desc Delete a message (soft delete)
 * @param messageId - The ID of the message to delete
 */
router.delete('/messages/:messageId', chatController.createHandler(chatController.delete.bind(chatController)));

export default router;