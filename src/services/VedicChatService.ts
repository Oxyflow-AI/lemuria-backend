import { BaseAstrologyChatService } from './base/BaseAstrologyChatService';
import { getAstrologyConfig } from '../config/astrology.config';

/**
 * Vedic Astrology Chat Service
 * 
 * Provides chat functionality specifically for Vedic astrology system.
 * Uses sidereal zodiac, nakshatras, dashas, and traditional Vedic techniques.
 * Integrates with Gemini AI model configured with Vedic astrology system instructions.
 */
export class VedicChatService extends BaseAstrologyChatService {
  /**
   * Initialize Vedic chat service with Vedic-specific AI configuration
   */
  constructor() {
    super('VEDIC', getAstrologyConfig('VEDIC'));
  }

  /**
   * Extract Vedic astrology details from user's profile
   * Includes rasi, nakshatra, lagna, and other Vedic-specific information
   */
  protected async getAstrologyDetails(userId: string, profileId?: number): Promise<string> {
    if (!profileId) {
      return 'No specific profile selected for Vedic analysis.';
    }

    const { data: profile } = await this.supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('profile_id', profileId)
      .eq('is_deleted', false)
      .single();

    if (!profile) {
      return 'Profile not found for Vedic analysis.';
    }

    let astrologyDetails = `
Vedic Astrology Details:
- Name: ${profile.firstname}${profile.lastname ? ' ' + profile.lastname : ''}
- Rasi (Moon Sign): ${profile.vedic_rasi || 'Not available'}
- Nakshatra (Birth Star): ${profile.vedic_nakshatra || 'Not available'}
- Lagna (Ascendant): ${profile.vedic_lagna || 'Not available'}`;

    if (profile.date_of_birth) {
      astrologyDetails += `\n- Date of Birth: ${profile.date_of_birth}`;
    }
    
    if (profile.time_of_birth) {
      astrologyDetails += `\n- Time of Birth: ${profile.time_of_birth}`;
    }
    
    if (profile.place_of_birth) {
      astrologyDetails += `\n- Place of Birth: ${profile.place_of_birth}`;
    }

    // Add additional Vedic details if available
    if (profile.vedic_tithi) {
      astrologyDetails += `\n- Tithi: ${profile.vedic_tithi}`;
    }
    
    if (profile.vedic_karana) {
      astrologyDetails += `\n- Karana: ${profile.vedic_karana}`;
    }
    
    if (profile.vedic_yoga) {
      astrologyDetails += `\n- Yoga: ${profile.vedic_yoga}`;
    }

    return astrologyDetails;
  }

  /**
   * Generate Vedic-specific fallback responses when AI is unavailable
   * Uses traditional Vedic remedies and terminology
   */
  protected getFallbackResponse(userMessage: string, profileInfo: string, astrologyDetails: string): string {
    const lowerMessage = userMessage.toLowerCase();
    const name = profileInfo ? `, ${profileInfo}` : '';
    
    if (lowerMessage.includes('marriage') || lowerMessage.includes('wedding') || lowerMessage.includes('spouse')) {
      return `${name ? `Dear ${profileInfo}` : 'Namaste'}, based on your Vedic chart, I see favorable marriage prospects. Your 7th house indicates a harmonious partnership. Consider performing Ganesha puja for obstacle removal and chant "Om Gam Ganapataye Namaha" daily. Favorable marriage periods are typically during Jupiter transits through beneficial houses.`;
    }

    if (lowerMessage.includes('career') || lowerMessage.includes('job') || lowerMessage.includes('profession')) {
      return `${name ? `Dear ${profileInfo}` : 'Namaste'}, your 10th house suggests success in communication-based fields. Consider careers in education, writing, or commerce. Worship Lord Ganesha on Wednesdays and wear yellow sapphire for Jupiter's blessings. Current planetary periods favor gradual career growth.`;
    }

    if (lowerMessage.includes('health') || lowerMessage.includes('medical')) {
      return `${name ? `Dear ${profileInfo}` : 'Namaste'}, according to Vedic principles, maintain balance in your lifestyle. Focus on respiratory health and avoid cold foods. Regular pranayama and meditation will strengthen your constitution. Wear silver jewelry and donate white items on Mondays for better health.`;
    }

    if (lowerMessage.includes('money') || lowerMessage.includes('wealth') || lowerMessage.includes('finance')) {
      return `${name ? `Dear ${profileInfo}` : 'Namaste'}, your wealth indicators show steady growth through honest means. Avoid speculation and focus on traditional investment methods. Perform Lakshmi puja on Fridays and keep a silver coin in your wallet. Favorable financial periods are during Venus-ruled months.`;
    }

    // Default Vedic response
    return `${name ? `Namaste ${profileInfo}` : 'Namaste'}, according to Vedic astrology, your current planetary period suggests a time for patience and spiritual growth. Focus on dharma (righteous living) and trust in divine timing. Regular prayer and meditation will help align you with cosmic energies. Consider consulting your birth chart for more specific guidance.`;
  }
}

export const vedicChatService = new VedicChatService();