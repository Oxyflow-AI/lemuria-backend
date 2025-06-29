import { logger } from '../utils/logger';
import { unifiedAstrologyService } from './unifiedAstrologyService';

// Vedic astrology calculation input interface
export interface VedicCalculationInput {
  date: Date; // Date object
  time: Date; // Date object for time
  place: string; // City, Country
}

// Vedic astrology calculation result interface
export interface VedicCalculationResult {
  rasi: string; // Moon sign
  nakshatra: string; // Birth star
  lagna: string; // Ascendant
  sunSign: string; // Sun sign
  moonLongitude: number; // Sidereal moon longitude
  ascendantLongitude: number; // Sidereal ascendant longitude
  sunLongitude: number; // Sidereal sun longitude
  coordinates: {
    latitude: number;
    longitude: number;
    timezone: string;
  };
}

class VedicAstrologyService {
  constructor() {
    // Service now uses unified astrology service with Kerykeion
  }

  /**
   * Main calculation method using Kerykeion via unified service
   */
  async calculateVedicAstrology(input: VedicCalculationInput): Promise<VedicCalculationResult> {
    try {
      logger.info('Starting Vedic astrology calculation', { place: input.place });

      const result = await unifiedAstrologyService.calculateVedicAstrology(
        input.date,
        input.time,
        input.place
      );

      // Convert to expected interface format
      const vedicResult: VedicCalculationResult = {
        rasi: result.rasi,
        nakshatra: result.nakshatra,
        lagna: result.lagna,
        sunSign: result.sunSign,
        moonLongitude: result.moonLongitude,
        ascendantLongitude: result.ascendantLongitude,
        sunLongitude: result.sunLongitude,
        coordinates: result.coordinates
      };

      logger.info('Vedic astrology calculation completed', { 
        place: input.place, 
        rasi: result.rasi, 
        nakshatra: result.nakshatra, 
        lagna: result.lagna,
        sunSign: result.sunSign
      });

      return vedicResult;

    } catch (error) {
      logger.error('Vedic astrology calculation failed', {
        error: error instanceof Error ? error.message : error,
        input
      });
      throw error;
    }
  }
}

export const vedicAstrologyService = new VedicAstrologyService();