import { BaseAstrologyChatService } from './base/BaseAstrologyChatService';
import { getAstrologyConfig } from '../config/astrology.config';

/**
 * Western Astrology Chat Service
 * 
 * Provides chat functionality specifically for Western astrology system.
 * Uses tropical zodiac, aspects, transits, and modern psychological approaches.
 * Integrates with Gemini AI model configured with Western astrology system instructions.
 */
export class WesternChatService extends BaseAstrologyChatService {
  /**
   * Initialize Western chat service with Western-specific AI configuration
   */
  constructor() {
    super('WESTERN', getAstrologyConfig('WESTERN'));
  }

  /**
   * Extract Western astrology details from user's profile
   * Includes Sun, Moon, Rising signs and other Western-specific planetary positions
   */
  protected async getAstrologyDetails(userId: string, profileId?: number): Promise<string> {
    if (!profileId) {
      return 'No specific profile selected for Western analysis.';
    }

    const { data: profile } = await this.supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('profile_id', profileId)
      .eq('is_deleted', false)
      .single();

    if (!profile) {
      return 'Profile not found for Western analysis.';
    }

    let astrologyDetails = `
Western Astrology Details:
- Name: ${profile.firstname}${profile.lastname ? ' ' + profile.lastname : ''}
- Sun Sign: ${profile.western_sun_sign || 'Not available'}
- Moon Sign: ${profile.western_moon_sign || 'Not available'}`;

    if (profile.date_of_birth) {
      astrologyDetails += `\n- Date of Birth: ${profile.date_of_birth}`;
    }
    
    if (profile.time_of_birth) {
      astrologyDetails += `\n- Time of Birth: ${profile.time_of_birth}`;
    }
    
    if (profile.place_of_birth) {
      astrologyDetails += `\n- Place of Birth: ${profile.place_of_birth}`;
    }

    // Add additional Western details if available
    if (profile.western_mercury_sign) {
      astrologyDetails += `\n- Mercury Sign: ${profile.western_mercury_sign}`;
    }
    
    if (profile.western_venus_sign) {
      astrologyDetails += `\n- Venus Sign: ${profile.western_venus_sign}`;
    }
    
    if (profile.western_mars_sign) {
      astrologyDetails += `\n- Mars Sign: ${profile.western_mars_sign}`;
    }

    return astrologyDetails;
  }

  /**
   * Generate Western-specific fallback responses when AI is unavailable
   * Uses modern remedies, crystals, and psychological approaches
   */
  protected getFallbackResponse(userMessage: string, profileInfo: string, astrologyDetails: string): string {
    const lowerMessage = userMessage.toLowerCase();
    const name = profileInfo ? `, ${profileInfo}` : '';
    
    if (lowerMessage.includes('love') || lowerMessage.includes('relationship') || lowerMessage.includes('romance')) {
      return `${name ? `Hello ${profileInfo}` : 'Hello'}, Venus energy suggests beautiful romantic opportunities ahead. Focus on self-love and authentic communication. Rose quartz and wearing pink/green colors will enhance your love vibrations. Full moons are particularly powerful for relationship manifestation.`;
    }

    if (lowerMessage.includes('career') || lowerMessage.includes('work') || lowerMessage.includes('job')) {
      return `${name ? `Hi ${profileInfo}` : 'Hello'}, your Midheaven indicates success through creativity and communication. Consider fields that allow self-expression. Wear citrine for confidence and network during Mercury favorable transits. New opportunities often come during New Moon periods.`;
    }

    if (lowerMessage.includes('money') || lowerMessage.includes('finances') || lowerMessage.includes('wealth')) {
      return `${name ? `Dear ${profileInfo}` : 'Hello'}, Jupiter's influence suggests steady financial growth through education and expansion. Avoid impulsive spending during Mercury retrograde. Green aventurine and Thursday affirmations will attract abundance. Focus on long-term investments.`;
    }

    if (lowerMessage.includes('health') || lowerMessage.includes('wellness')) {
      return `${name ? `Hi ${profileInfo}` : 'Hello'}, your chart suggests paying attention to stress management and emotional well-being. Regular exercise and meditation are beneficial. Amethyst and moonstone support healing. Align activities with lunar cycles for optimal health results.`;
    }

    if (lowerMessage.includes('purpose') || lowerMessage.includes('spiritual') || lowerMessage.includes('growth')) {
      return `${name ? `Dear ${profileInfo}` : 'Hello'}, your North Node points toward personal growth through authentic self-expression. Trust your intuition and embrace transformation. Clear quartz amplifies your spiritual connection. Journal during New Moons to gain clarity on your soul's purpose.`;
    }

    // Default Western response
    return `${name ? `Hello ${profileInfo}` : 'Hello'}, the current planetary alignments encourage personal reflection and growth. Trust your inner wisdom and pay attention to synchronicities. Each challenge is an opportunity for evolution. Consider meditating with crystals that resonate with your birth chart for enhanced guidance.`;
  }
}

export const westernChatService = new WesternChatService();