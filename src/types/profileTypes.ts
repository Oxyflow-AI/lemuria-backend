import { BaseEntity, GenderType } from './baseTypes';

// Profile entity
export interface Profile extends BaseEntity {
  profile_id: number;
  firstname: string;
  middlename?: string;
  lastname?: string;
  gender: GenderType;
  date_of_birth: string; // Now mandatory
  time_of_birth: string; // Now mandatory
  place_of_birth: string; // Now mandatory
  timezone?: string;
  // Western astrology fields (only sun and moon signs stored)
  western_sun_sign?: string;
  western_moon_sign?: string;
  // Vedic astrology fields
  vedic_rasi?: string;
  vedic_nakshatra?: string;
  vedic_lagna?: string;
  is_deleted: boolean;
  deleted_at?: string;
}

// Profile DTOs
export interface CreateProfileDto {
  firstname: string;
  middlename?: string;
  lastname?: string;
  gender: GenderType;
  date_of_birth: string; // Now mandatory
  time_of_birth: string; // Now mandatory
  place_of_birth: string; // Now mandatory
  timezone?: string;
  calculate_astrology?: boolean;
  // Western astrology fields (only sun and moon signs stored)
  western_sun_sign?: string;
  western_moon_sign?: string;
  // Vedic astrology fields
  vedic_rasi?: string;
  vedic_nakshatra?: string;
  vedic_lagna?: string;
  set_as_primary?: boolean;
}

export interface UpdateProfileDto {
  firstname?: string;
  middlename?: string;
  lastname?: string;
  gender?: GenderType;
  date_of_birth?: string;
  time_of_birth?: string;
  place_of_birth?: string;
  timezone?: string;
  // Western astrology fields (only sun and moon signs stored)
  western_sun_sign?: string;
  western_moon_sign?: string;
  // Vedic astrology fields
  vedic_rasi?: string;
  vedic_nakshatra?: string;
  vedic_lagna?: string;
  // Flag to trigger astrology calculation during update
  calculate_astrology?: boolean;
}

export interface ProfileResponseDto extends Profile {
  is_primary: boolean;
}