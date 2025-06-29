import { spawn } from 'child_process';
import path from 'path';
import { logger } from '../utils/logger';
import { AstrologySystemType } from '../types/baseTypes';

// Unified interfaces for both Vedic and Western astrology
export interface AstrologyCalculationInput {
  date: Date;
  time: Date;
  place: string;
  system: AstrologySystemType;
}

export interface VedicCalculationResult {
  success: boolean;
  system: 'VEDIC';
  rasi: string; // Moon sign
  nakshatra: string; // Birth star
  lagna: string; // Ascendant
  sunSign: string; // Sun sign in Vedic system
  moonLongitude: number;
  ascendantLongitude: number;
  sunLongitude: number;
  coordinates: {
    latitude: number;
    longitude: number;
    timezone: string;
  };
  raw_data: {
    moon_sign: string;
    sun_sign: string;
    ascendant_sign: string;
  };
}

export interface WesternCalculationResult {
  success: boolean;
  system: 'WESTERN';
  sunSign: string; // Sun sign
  moonSign: string; // Moon sign
  ascendant: string; // Ascendant/Rising sign
  moonLongitude: number;
  ascendantLongitude: number;
  sunLongitude: number;
  coordinates: {
    latitude: number;
    longitude: number;
    timezone: string;
  };
  raw_data: {
    moon_sign: string;
    sun_sign: string;
    ascendant_sign: string;
  };
}

export type AstrologyCalculationResult = VedicCalculationResult | WesternCalculationResult;

class UnifiedAstrologyService {
  /**
   * Calculate astrology using Kerykeion Python library
   */
  private async calculateWithKerykeion(
    date: Date, 
    time: Date, 
    place: string, 
    system: AstrologySystemType
  ): Promise<AstrologyCalculationResult> {
    return new Promise((resolve, reject) => {
      try {
        // Format data for Python script
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
        const name = 'User'; // Default name
        
        // Path to Python script
        const scriptPath = path.join(process.cwd(), 'scripts', 'kerykeion_calculator.py');
        
        // Get Python path from environment or use default
        const pythonPath = process.env.PYTHON_PATH || 'python3';
        
        // Spawn Python process with system parameter
        const pythonProcess = spawn(pythonPath, [scriptPath, name, dateStr, timeStr, place, system]);
        
        let outputData = '';
        let errorData = '';
        
        pythonProcess.stdout.on('data', (data) => {
          outputData += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
          errorData += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
          if (code === 0) {
            try {
              const result = JSON.parse(outputData.trim());
              resolve(result);
            } catch (parseError) {
              reject(new Error(`Failed to parse Python output: ${parseError}`));
            }
          } else {
            reject(new Error(`Python script failed with code ${code}: ${errorData}`));
          }
        });
        
        pythonProcess.on('error', (error) => {
          reject(new Error(`Failed to start Python process: ${error.message}`));
        });
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Main calculation method for both Vedic and Western astrology
   */
  async calculateAstrology(input: AstrologyCalculationInput): Promise<AstrologyCalculationResult> {
    try {
      logger.info('Starting astrology calculation with Kerykeion', { 
        place: input.place, 
        system: input.system 
      });

      // Try Kerykeion first (most accurate)
      const result = await this.calculateWithKerykeion(
        input.date, 
        input.time, 
        input.place, 
        input.system
      );
      
      if (result.success) {
        logger.info('Kerykeion calculations successful', { 
          system: input.system,
          place: input.place 
        });
        return result;
      } else {
        throw new Error('Kerykeion calculation failed');
      }
      
    } catch (error) {
      logger.error('Astrology calculation failed', {
        error: error instanceof Error ? error.message : error,
        input
      });
      throw error;
    }
  }

  /**
   * Calculate Vedic astrology specifically
   */
  async calculateVedicAstrology(
    date: Date, 
    time: Date, 
    place: string
  ): Promise<VedicCalculationResult> {
    const result = await this.calculateAstrology({
      date,
      time,
      place,
      system: 'VEDIC'
    });
    
    if (result.system !== 'VEDIC') {
      throw new Error('Expected Vedic calculation result');
    }
    
    return result as VedicCalculationResult;
  }

  /**
   * Calculate Western astrology specifically
   */
  async calculateWesternAstrology(
    date: Date, 
    time: Date, 
    place: string
  ): Promise<WesternCalculationResult> {
    const result = await this.calculateAstrology({
      date,
      time,
      place,
      system: 'WESTERN'
    });
    
    if (result.system !== 'WESTERN') {
      throw new Error('Expected Western calculation result');
    }
    
    return result as WesternCalculationResult;
  }
}

export const unifiedAstrologyService = new UnifiedAstrologyService();