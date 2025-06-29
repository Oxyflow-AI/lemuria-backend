import { Response } from 'express';
import { BaseController } from './baseController';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { profileService } from '../services/profileService';
import { CreateProfileDto, UpdateProfileDto } from '../types/profileTypes';

export class ProfileController extends BaseController {
  /**
   * Get all profiles for authenticated user
   */
  async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    const options = this.getQueryOptions(req);

    this.logAction('Get all profiles', userId);

    const result = await profileService.getAllProfiles(userId, options);
    this.sendSuccess(res, result);
  }

  /**
   * Get profile by ID
   */
  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    const profileId = this.getIdParam(req, 'profileId');

    this.logAction('Get profile by ID', userId, { profileId });

    const profile = await profileService.getProfileById(userId, profileId);
    this.sendSuccess(res, profile);
  }

  /**
   * Create new profile
   */
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    const profileData: CreateProfileDto = req.body;

    this.logAction('Create profile', userId, { 
      firstname: profileData.firstname,
      gender: profileData.gender
    });

    const profile = await profileService.createProfile(userId, profileData);
    this.sendSuccess(res, profile, 201);
  }

  /**
   * Update profile
   */
  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    const profileId = this.getIdParam(req, 'profileId');
    const updateData: UpdateProfileDto = req.body;

    this.logAction('Update profile', userId, { profileId });

    const profile = await profileService.updateProfile(userId, profileId, updateData);
    this.sendSuccess(res, profile);
  }

  /**
   * Delete profile
   */
  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    const profileId = this.getIdParam(req, 'profileId');

    this.logAction('Delete profile', userId, { profileId });

    await profileService.deleteProfile(userId, profileId);
    this.sendSuccess(res, { message: 'Profile deleted successfully' });
  }

  /**
   * Get primary profile
   */
  async getPrimary(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.getUserId(req);

    this.logAction('Get primary profile', userId);

    const profile = await profileService.getPrimaryProfile(userId);
    this.sendSuccess(res, profile);
  }
}

export const profileController = new ProfileController();