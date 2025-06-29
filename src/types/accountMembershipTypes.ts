import { BaseEntity } from './baseTypes';

// AccountMembership entity
export interface AccountMembership {
  membership_id: number;
  account_id: number;
  profile_id: number;
  created_at: string;
}

// AccountMembership DTOs
export interface CreateAccountMembershipDto {
  account_id: number;
  profile_id: number;
}

export interface UpdateAccountMembershipDto {
  // Currently no updateable fields for account membership
}

export interface AccountMembershipResponseDto extends AccountMembership {
  // Additional computed fields if needed
}