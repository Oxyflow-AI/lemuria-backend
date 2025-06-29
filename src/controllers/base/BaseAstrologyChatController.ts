import { Response } from 'express';
import { BaseController } from '../baseController';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import { CreateChatMessageDto, UpdateChatMessageDto } from '../../types/chatTypes';
import { BaseAstrologyChatService } from '../../services/base/BaseAstrologyChatService';

export abstract class BaseAstrologyChatController extends BaseController {
  protected chatService: BaseAstrologyChatService;
  protected astrologySystem: 'VEDIC' | 'WESTERN';

  constructor(chatService: BaseAstrologyChatService, astrologySystem: 'VEDIC' | 'WESTERN') {
    super();
    this.chatService = chatService;
    this.astrologySystem = astrologySystem;
  }

  /**
   * Get chat history
   */
  async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    const options = this.getQueryOptions(req);
    const profileId = req.query.profile_id ? parseInt(req.query.profile_id as string) : undefined;

    const result = await this.chatService.getChatHistory(userId, profileId, options);
    this.sendSuccess(res, result);
  }

  /**
   * Get message by ID
   */
  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    const messageId = this.getIdParam(req, 'messageId');

    const message = await this.chatService.getMessageById(userId, messageId);
    this.sendSuccess(res, message);
  }

  /**
   * Send new message
   */
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    const messageData: CreateChatMessageDto = req.body;

    const result = await this.chatService.sendMessage(userId, messageData);
    this.sendSuccess(res, {
      user_message: result.userMessage,
      bot_response: result.botResponse
    }, 201);
  }

  /**
   * Update message
   */
  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    const messageId = this.getIdParam(req, 'messageId');
    const updateData: UpdateChatMessageDto = req.body;

    const message = await this.chatService.updateMessage(userId, messageId, updateData);
    this.sendSuccess(res, message);
  }

  /**
   * Delete message
   */
  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    const messageId = this.getIdParam(req, 'messageId');

    await this.chatService.deleteMessage(userId, messageId);
    this.sendSuccess(res, { message: 'Message deleted successfully' });
  }

  /**
   * Get chat history (alias for getAll)
   */
  async getChatHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    return this.getAll(req, res);
  }

  /**
   * Send message (alias for create)
   */
  async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    return this.create(req, res);
  }
}