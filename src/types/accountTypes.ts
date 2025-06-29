import { BaseEntity } from './baseTypes';

// Account entity
export interface Account extends BaseEntity {
  account_id: number;
  user_id: string;
}

// Account DTOs
export interface CreateAccountDto {
  user_id: string;
}

export interface UpdateAccountDto {
  // Currently no updateable fields for accounts
}

export interface AccountResponseDto extends Account {
  // Additional computed fields if needed
}