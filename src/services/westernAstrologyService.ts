import { logger } from '../utils/logger';
import { unifiedAstrologyService } from './unifiedAstrologyService';

// Western astrology calculation input interface
export interface WesternCalculationInput {
  date: Date; // Date object
  time: Date; // Date object for time
  place: string; // City, Country
}

// Western astrology calculation result interface
export interface WesternCalculationResult {
  sunSign: string; // Sun sign
  moonSign: string; // Moon sign
  ascendant: string; // Ascendant/Rising sign
  moonLongitude: number; // Tropical moon longitude
  ascendantLongitude: number; // Tropical ascendant longitude
  sunLongitude: number; // Tropical sun longitude
  coordinates: {
    latitude: number;
    longitude: number;
    timezone: string;
  };
}

class WesternAstrologyService {
  constructor() {
    // Service uses unified astrology service with Kerykeion
  }

  /**
   * Main calculation method using Kerykeion via unified service
   */
  async calculateWesternAstrology(input: WesternCalculationInput): Promise<WesternCalculationResult> {
    try {
      logger.info('Starting Western astrology calculation', { place: input.place });

      const result = await unifiedAstrologyService.calculateWesternAstrology(
        input.date,
        input.time,
        input.place
      );

      // Convert to expected interface format
      const westernResult: WesternCalculationResult = {
        sunSign: result.sunSign,
        moonSign: result.moonSign,
        ascendant: result.ascendant,
        moonLongitude: result.moonLongitude,
        ascendantLongitude: result.ascendantLongitude,
        sunLongitude: result.sunLongitude,
        coordinates: result.coordinates
      };

      logger.info('Western astrology calculation completed', { 
        place: input.place, 
        sunSign: result.sunSign, 
        moonSign: result.moonSign, 
        ascendant: result.ascendant
      });

      return westernResult;

    } catch (error) {
      logger.error('Western astrology calculation failed', {
        error: error instanceof Error ? error.message : error,
        input
      });
      throw error;
    }
  }
}

export const westernAstrologyService = new WesternAstrologyService();