// Base types and enums
export type GenderType = 'MALE' | 'FEMALE' | 'RATHER_NOT_SAY';
export type LanguageType = 'ENGLISH' | 'TAMIL' | 'HINDI';
export type AstrologySystemType = 'WESTERN' | 'VEDIC';
export type SenderType = 'USER' | 'BOT';
export type ThemeType = 'light' | 'dark' | 'auto';

// Base entity interface
export interface BaseEntity {
  created_at: string;
  updated_at: string;
}

// Pagination interface
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface PaginationResult {
  limit: number;
  offset: number;
  total: number;
}

// Query options interface
export interface QueryOptions extends PaginationOptions {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}