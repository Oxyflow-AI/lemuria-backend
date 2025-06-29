import { BaseEntity, LanguageType, AstrologySystemType, ThemeType } from './baseTypes';

// AccountSettings entity
export interface AccountSettings extends BaseEntity {
  account_id: number;
  preferred_language: LanguageType;
  astrology_system: AstrologySystemType;
  timezone: string;
  notification_preferences: Record<string, any>;
  theme: ThemeType;
  primary_profile?: number;
}

// AccountSettings DTOs
export interface CreateAccountSettingsDto {
  account_id: number;
  preferred_language?: LanguageType;
  astrology_system?: AstrologySystemType;
  timezone?: string;
  notification_preferences?: Record<string, any>;
  theme?: ThemeType;
  primary_profile?: number;
}

export interface UpdateAccountSettingsDto {
  preferred_language?: LanguageType;
  astrology_system?: AstrologySystemType;
  timezone?: string;
  notification_preferences?: Record<string, any>;
  theme?: ThemeType;
  primary_profile?: number;
}

export interface AccountSettingsResponseDto extends AccountSettings {
  // Additional computed fields if needed
}