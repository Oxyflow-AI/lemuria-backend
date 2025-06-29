import { BaseEntity, SenderType } from './baseTypes';

// Chat entity
export interface ChatMessage {
  message_id: number;
  account_id: number;
  profile_id?: number;
  sender_type: SenderType;
  content: string;
  astrology_system: 'VEDIC' | 'WESTERN';
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
}

// Chat DTOs
export interface CreateChatMessageDto {
  profile_id?: number;
  content: string;
}

export interface UpdateChatMessageDto {
  content?: string;
}

export interface ChatMessageResponseDto extends ChatMessage {
  // Additional computed fields if needed
}

export interface ChatHistoryResponseDto {
  messages: ChatMessageResponseDto[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}