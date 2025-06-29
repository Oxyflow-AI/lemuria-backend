import { BaseService } from '../baseService';
import { 
  ChatMessage,
  CreateChatMessageDto,
  UpdateChatMessageDto,
  ChatMessageResponseDto,
  ChatHistoryResponseDto
} from '../../types/chatTypes';
import { QueryOptions } from '../../types/baseTypes';
import { logger } from '../../utils/logger';
import { DatabaseError } from '../../utils/errorHandler';
import { ValidationError, NotFoundError } from '../../utils/errorHandler';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AstrologyModelConfig } from '../../config/astrology.config';

/**
 * Abstract base service for astrology chat functionality
 * Provides common chat operations for both Vedic and Western astrology systems
 * Integrates with Google's Gemini AI for intelligent astrological responses
 */
export abstract class BaseAstrologyChatService extends BaseService {
  protected genAI?: GoogleGenerativeAI;
  protected model?: any;
  protected astrologySystem: 'VEDIC' | 'WESTERN';

  /**
   * Initialize the astrology chat service with specific system configuration
   * @param astrologySystem The astrology system type (VEDIC or WESTERN)
   * @param config Configuration for the AI model including system instructions
   */
  constructor(astrologySystem: 'VEDIC' | 'WESTERN', config: AstrologyModelConfig) {
    super();
    this.astrologySystem = astrologySystem;
    this.initializeModel(config);
  }

  /**
   * Initialize Google Gemini AI model with system-specific configuration
   * @param config Model configuration including instructions and parameters
   */
  private initializeModel(config: AstrologyModelConfig): void {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.warn('GEMINI_API_KEY not found in environment variables');
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: config.model,
        systemInstruction: config.systemInstruction,
        generationConfig: {
          maxOutputTokens: config.maxTokens,
          temperature: config.temperature
        }
      });
    }
  }

  /**
   * Get chat history for user
   */
  async getChatHistory(
    userId: string, 
    profileId?: number, 
    options?: QueryOptions
  ): Promise<ChatHistoryResponseDto> {
    const account = await this.getUserAccount(userId);

    // Build query - exclude deleted messages
    let query = this.supabaseAdmin
      .from('chat')
      .select('*')
      .eq('account_id', account.account_id)
      .eq('is_deleted', false);

    // Filter by profile if specified
    if (profileId !== undefined) {
      await this.validateResourceOwnership('profiles', profileId, userId, 'profile_id');
      query = query.eq('profile_id', profileId);
    } else {
      query = query.is('profile_id', null);
    }

    // Apply sorting and pagination
    query = this.applySorting(query, options);
    query = this.applyPagination(query, options);

    const { data: messages, error } = await query;

    if (error) {
      logger.error('Failed to get chat history', { 
        error: error.message,
        userId,
        profileId
      });
      throw new Error('Failed to retrieve chat history');
    }

    // Get total count for pagination
    const total = await this.getTotalCount('chat', { 
      account_id: account.account_id,
      is_deleted: false,
      ...(profileId !== undefined ? { profile_id: profileId } : { profile_id: null })
    });

    return {
      messages: messages || [],
      pagination: {
        limit: options?.limit || 50,
        offset: options?.offset || 0,
        total
      }
    };
  }

  /**
   * Get message by ID
   */
  async getMessageById(userId: string, messageId: number): Promise<ChatMessageResponseDto> {
    await this.validateResourceOwnership('chat', messageId, userId, 'message_id');

    const message = await this.executeQuery<ChatMessage>(
      async () => this.supabaseAdmin
        .from('chat')
        .select('*')
        .eq('message_id', messageId)
        .eq('is_deleted', false)
        .single(),
      'get message by ID'
    );

    return message as ChatMessageResponseDto;
  }

  /**
   * Send new message
   */
  async sendMessage(userId: string, messageData: CreateChatMessageDto): Promise<{
    userMessage: ChatMessageResponseDto;
    botResponse: ChatMessageResponseDto;
  }> {
    this.validateMessageData(messageData);
    
    const account = await this.getUserAccount(userId);

    // Validate profile access if specified
    if (messageData.profile_id) {
      await this.validateResourceOwnership('profiles', messageData.profile_id, userId, 'profile_id');
    }

    // Create user message
    const userMessage = await this.executeQuery<ChatMessage>(
      async () => this.supabaseAdmin
        .from('chat')
        .insert({
          account_id: account.account_id,
          profile_id: messageData.profile_id,
          sender_type: 'USER',
          content: messageData.content.trim()
        })
        .select()
        .single(),
      'create user message'
    );

    // Generate bot response
    const botResponseContent = await this.generateBotResponse(
      messageData.content,
      userId,
      messageData.profile_id
    );

    const botMessage = await this.executeQuery<ChatMessage>(
      async () => this.supabaseAdmin
        .from('chat')
        .insert({
          account_id: account.account_id,
          profile_id: messageData.profile_id,
          sender_type: 'BOT',
          content: botResponseContent
        })
        .select()
        .single(),
      'create bot message'
    );

    return {
      userMessage: userMessage as ChatMessageResponseDto,
      botResponse: botMessage as ChatMessageResponseDto
    };
  }

  /**
   * Update message (only user messages can be updated)
   */
  async updateMessage(
    userId: string, 
    messageId: number, 
    updateData: UpdateChatMessageDto
  ): Promise<ChatMessageResponseDto> {
    this.validateUpdateData(updateData);
    
    await this.validateResourceOwnership('chat', messageId, userId, 'message_id');

    // Validate it's a user message and not deleted
    const { data: existingMessage } = await this.supabaseAdmin
      .from('chat')
      .select('sender_type, is_deleted')
      .eq('message_id', messageId)
      .eq('is_deleted', false)
      .single();

    if (!existingMessage) {
      throw new NotFoundError('Message not found or has been deleted');
    }

    if (existingMessage.sender_type !== 'USER') {
      throw new ValidationError('Only user messages can be updated');
    }

    const message = await this.executeQuery<ChatMessage>(
      async () => this.supabaseAdmin
        .from('chat')
        .update({ content: updateData.content?.trim() })
        .eq('message_id', messageId)
        .select()
        .single(),
      'update message'
    );

    return message as ChatMessageResponseDto;
  }

  /**
   * Delete message (soft delete)
   */
  async deleteMessage(userId: string, messageId: number): Promise<void> {
    await this.validateResourceOwnership('chat', messageId, userId, 'message_id');

    // Execute update without expecting data return (since it's a soft delete)
    const { error } = await this.supabaseAdmin
      .from('chat')
      .update({ 
        is_deleted: true, 
        deleted_at: new Date().toISOString() 
      })
      .eq('message_id', messageId);

    if (error) {
      logger.error('Failed to delete message', { messageId, userId, error: error.message });
      throw new DatabaseError(`Failed to delete message: ${error.message}`);
    }

    logger.info('Message deleted successfully', { messageId, userId });
  }

  // Abstract method to be implemented by subclasses
  protected abstract getAstrologyDetails(userId: string, profileId?: number): Promise<string>;
  protected abstract getFallbackResponse(userMessage: string, profileInfo: string, astrologyDetails: string): string;

  protected async generateBotResponse(
    userMessage: string, 
    userId: string, 
    profileId?: number
  ): Promise<string> {
    try {
      const account = await this.getUserAccount(userId);
      
      // Get user's profile information
      let profileInfo = '';
      if (profileId) {
        const { data: profile } = await this.supabaseAdmin
          .from('profiles')
          .select('firstname')
          .eq('profile_id', profileId)
          .eq('is_deleted', false)
          .single();

        if (profile) {
          profileInfo = profile.firstname;
        }
      }

      // Get detailed astrological data
      const astrologyDetails = await this.getAstrologyDetails(userId, profileId);

      // Get last 10 messages for context
      const { data: recentMessages } = await this.supabaseAdmin
        .from('chat')
        .select('sender_type, content, created_at')
        .eq('account_id', account.account_id)
        .eq('profile_id', profileId || null)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(10);

      // Use Gemini if available, otherwise fall back to simple responses
      if (this.model) {
        // Build conversation history for Gemini
        const conversationHistory = recentMessages?.map((msg: any) => ({
          role: msg.sender_type === 'USER' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })) || [];

        // Build user context
        let userContext = '';
        
        if (this.astrologySystem) {
          userContext += `Astrology System: ${this.astrologySystem}\n\n`;
        }
        
        if (astrologyDetails.trim()) {
          userContext += `${astrologyDetails}\n\n`;
        }
        
        userContext += `Question: ${userMessage}`;
        
        if (profileInfo) {
          userContext += `\n\nUser's name: ${profileInfo}`;
        }

        // Start chat with conversation history
        const chat = this.model.startChat({
          history: conversationHistory
        });

        const result = await chat.sendMessage(userContext);
        const response = await result.response;
        return response.text();
      } else {
        // Fallback to simple responses if Gemini is not available
        return this.getFallbackResponse(userMessage, profileInfo, astrologyDetails);
      }

    } catch (error) {
      logger.error('Bot response generation failed', { 
        error: error instanceof Error ? error.message : error,
        userId,
        profileId
      });
      
      return `I appreciate your message! While I'm having a moment of cosmic static, I'd love to help you explore your ${this.astrologySystem.toLowerCase()} astrological insights. Could you try rephrasing your question?`;
    }
  }

  // Validation methods
  private validateMessageData(data: CreateChatMessageDto): void {
    if (!data.content?.trim()) {
      throw new ValidationError('Message content is required', 'content');
    }

    if (data.content.trim().length > 1000) {
      throw new ValidationError('Message content too long (max 1000 characters)', 'content');
    }
  }

  private validateUpdateData(data: UpdateChatMessageDto): void {
    if (data.content !== undefined) {
      if (!data.content?.trim()) {
        throw new ValidationError('Message content cannot be empty', 'content');
      }

      if (data.content.trim().length > 1000) {
        throw new ValidationError('Message content too long (max 1000 characters)', 'content');
      }
    }
  }
}