import Joi from 'joi';

// Basic validation schemas
const emailSchema = Joi.string().email().required();
const passwordSchema = Joi.string().min(6).required();
const nameSchema = Joi.string().min(1).max(100).trim();

// Auth validation schemas
export const signUpSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
  full_name: Joi.string().max(255).optional()
});

export const signInSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema
});

export const resetPasswordSchema = Joi.object({
  email: emailSchema
});

export const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required()
});

// Valid Vedic values from schema
const validRasis = ['Mesha', 'Vrishabha', 'Mithuna', 'Kataka', 'Simha', 'Kanya', 'Tula', 'Vrischika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'];
const validNakshatras = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'];
const validZodiacs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

// Profile validation schemas
export const createProfileSchema = Joi.object({
  firstname: nameSchema.required(),
  middlename: nameSchema.optional(),
  lastname: nameSchema.optional(),
  gender: Joi.string().valid('MALE', 'FEMALE', 'RATHER_NOT_SAY').required(),
  
  // Birth details (now mandatory)
  date_of_birth: Joi.date().required(),
  time_of_birth: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(), // HH:MM format
  place_of_birth: Joi.string().max(200).required(),
  
  // Astrology calculation option
  calculate_astrology: Joi.boolean().optional(),
  
  // Direct astrology input with exact schema validation
  western_sun_sign: Joi.string().valid(...validZodiacs).optional(),
  western_moon_sign: Joi.string().valid(...validZodiacs).optional(),
  vedic_rasi: Joi.string().valid(...validRasis).optional(),
  vedic_nakshatra: Joi.string().valid(...validNakshatras).optional(),
  vedic_lagna: Joi.string().valid(...validRasis).optional(), // Lagna uses same values as rasi
  
  // Account settings
  language: Joi.string().valid('ENGLISH', 'TAMIL', 'HINDI').optional(),
  set_as_primary: Joi.boolean().optional()
});

export const updateProfileSchema = Joi.object({
  firstname: nameSchema.optional(),
  middlename: nameSchema.optional(),
  lastname: nameSchema.optional(),
  gender: Joi.string().valid('MALE', 'FEMALE', 'RATHER_NOT_SAY').optional(),
  date_of_birth: Joi.date().optional(),
  time_of_birth: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  place_of_birth: Joi.string().max(200).optional(),
  western_sun_sign: Joi.string().valid(...validZodiacs).optional(),
  western_moon_sign: Joi.string().valid(...validZodiacs).optional(),
  vedic_rasi: Joi.string().valid(...validRasis).optional(),
  vedic_nakshatra: Joi.string().valid(...validNakshatras).optional(),
  vedic_lagna: Joi.string().valid(...validRasis).optional()
});

// Account settings validation schemas
export const createAccountSettingsSchema = Joi.object({
  preferred_language: Joi.string().valid('ENGLISH', 'TAMIL', 'HINDI').optional(),
  astrology_system: Joi.string().valid('WESTERN', 'VEDIC').optional(),
  timezone: Joi.string().max(50).optional(),
  notification_preferences: Joi.object().optional(),
  theme: Joi.string().valid('light', 'dark', 'auto').optional()
});

export const updateAccountSettingsSchema = Joi.object({
  preferred_language: Joi.string().valid('ENGLISH', 'TAMIL', 'HINDI').optional(),
  astrology_system: Joi.string().valid('WESTERN', 'VEDIC').optional(),
  timezone: Joi.string().max(50).optional(),
  notification_preferences: Joi.object().optional(),
  theme: Joi.string().valid('light', 'dark', 'auto').optional()
});

