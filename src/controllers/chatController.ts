import { Response } from 'express';
import { BaseController } from './baseController';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { vedicChatService } from '../services/VedicChatService';
import { westernChatService } from '../services/WesternChatService';
import { accountSettingsService } from '../services/accountSettingsService';
import { CreateChatMessageDto, UpdateChatMessageDto } from '../types/chatTypes';
import { ValidationError } from '../utils/errorHandler';

/**
 * Unified Chat Controller
 * 
 * Automatically determines which astrology system to use (Vedic or Western)
 * based on the user's account settings. Provides a single API endpoint
 * that routes to the appropriate service implementation.
 */
export class ChatController extends BaseController {
  /**
   * Get the appropriate chat service based on user's account settings
   */
  private async getChatService(userId: string) {
    try {
      // Get user's account settings to determine astrology system
      const settings = await accountSettingsService.getAccountSettings(userId);
      const astrologySystem = settings.astrology_system || 'VEDIC'; // Default to VEDIC
      
      return astrologySystem === 'WESTERN' ? westernChatService : vedicChatService;
    } catch (error) {
      // Default to Vedic if we can't determine the system
      return vedicChatService;
    }
  }

  /**
   * Get chat history for the user using their preferred astrology system
   */
  async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    const profileId = req.query.profile_id ? parseInt(req.query.profile_id as string) : undefined;
    const options = this.getQueryOptions(req);

    this.logAction('get chat history', userId, { profileId });

    const chatService = await this.getChatService(userId);
    const result = await chatService.getChatHistory(userId, profileId, options);
    
    this.sendSuccess(res, result);
  }

  /**
   * Get specific message by ID using the user's preferred astrology system
   */
  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    const messageId = this.getIdParam(req, 'messageId');

    this.logAction('get message by id', userId, { messageId });

    const chatService = await this.getChatService(userId);
    const message = await chatService.getMessageById(userId, messageId);
    
    this.sendSuccess(res, message);
  }

  /**
   * Send new message using the user's preferred astrology system
   */
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    const messageData: CreateChatMessageDto = req.body;

    this.logAction('send message', userId, { content: messageData.content?.substring(0, 50) });

    const chatService = await this.getChatService(userId);
    const result = await chatService.sendMessage(userId, messageData);
    
    this.sendSuccess(res, result, 201);
  }

  /**
   * Update message using the user's preferred astrology system
   */
  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    const messageId = this.getIdParam(req, 'messageId');
    const updateData: UpdateChatMessageDto = req.body;

    this.logAction('update message', userId, { messageId });

    const chatService = await this.getChatService(userId);
    const message = await chatService.updateMessage(userId, messageId, updateData);
    
    this.sendSuccess(res, message);
  }

  /**
   * Delete message using the user's preferred astrology system
   */
  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    const messageId = this.getIdParam(req, 'messageId');

    this.logAction('delete message', userId, { messageId });

    const chatService = await this.getChatService(userId);
    await chatService.deleteMessage(userId, messageId);
    
    this.sendSuccess(res, { message: 'Message deleted successfully' });
  }
}

export const chatController = new ChatController();