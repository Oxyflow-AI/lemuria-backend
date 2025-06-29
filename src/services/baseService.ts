import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient, getSupabaseAdminClient } from '../config/database';
import { config } from '../config/app.config';
import { logger } from '../utils/logger';
import { UnauthorizedError, DatabaseError, NotFoundError } from '../utils/errorHandler';
import { PaginationOptions, QueryOptions } from '../types/baseTypes';

export abstract class BaseService {
  protected supabase: SupabaseClient;
  protected supabaseAdmin: SupabaseClient;

  constructor() {
    this.supabase = getSupabaseClient();
    this.supabaseAdmin = getSupabaseAdminClient();
  }

  /**
   * Validate that a user has access to perform operations
   */
  protected validateUserAccess(userId: string): void {
    if (!userId) {
      throw new UnauthorizedError('User ID is required');
    }
  }

  /**
   * Get user's account ID with validation
   */
  protected async getUserAccount(userId: string): Promise<{ account_id: number }> {
    this.validateUserAccess(userId);

    const { data: account, error } = await this.supabaseAdmin
      .from('accounts')
      .select('account_id')
      .eq('user_id', userId)
      .single();

    if (error || !account) {
      logger.error('Failed to get user account', { userId, error: error?.message });
      throw new NotFoundError('User account not found');
    }

    return account;
  }

  /**
   * Validate that a resource belongs to the user
   */
  protected async validateResourceOwnership(
    table: string,
    resourceId: number,
    userId: string,
    resourceColumn: string = 'id'
  ): Promise<void> {
    const account = await this.getUserAccount(userId);
    
    // Special handling for profiles table - check through account_membership
    if (table === 'profiles' && resourceColumn === 'profile_id') {
      const { data, error } = await this.supabaseAdmin
        .from('account_membership')
        .select('profile_id')
        .eq('account_id', account.account_id)
        .eq('profile_id', resourceId)
        .single();

      if (error || !data) {
        throw new NotFoundError(`Resource not found in ${table}`);
      }
      return;
    }
    
    // Regular validation for other tables
    const { data, error } = await this.supabaseAdmin
      .from(table)
      .select('account_id')
      .eq(resourceColumn, resourceId)
      .single();

    if (error || !data) {
      throw new NotFoundError(`Resource not found in ${table}`);
    }

    if (data.account_id !== account.account_id) {
      throw new UnauthorizedError('Access denied to this resource');
    }
  }

  /**
   * Execute database operation with error handling
   */
  protected async executeQuery<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    context: string
  ): Promise<T> {
    try {
      const { data, error } = await operation();

      if (error) {
        logger.error(`Database operation failed: ${context}`, { error: error.message });
        throw new DatabaseError(`Database operation failed: ${error.message}`);
      }

      if (data === null) {
        throw new NotFoundError('Resource not found');
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error(`Unexpected error in ${context}`, { 
        error: error instanceof Error ? error.message : error 
      });
      throw new DatabaseError(`Operation failed: ${context}`);
    }
  }

  /**
   * Apply pagination to query
   */
  protected applyPagination(query: any, options?: PaginationOptions) {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    return query.range(offset, offset + limit - 1);
  }

  /**
   * Apply sorting to query
   */
  protected applySorting(query: any, options?: QueryOptions) {
    if (options?.sortBy) {
      const ascending = options.sortOrder !== 'desc';
      return query.order(options.sortBy, { ascending });
    }
    
    // Default sorting by created_at desc
    return query.order('created_at', { ascending: false });
  }

  /**
   * Get total count for pagination
   */
  protected async getTotalCount(table: string, filters?: any): Promise<number> {
    let query = this.supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    const { count, error } = await query;

    if (error) {
      logger.error('Failed to get count', { table, error: error.message });
      return 0;
    }

    return count || 0;
  }
}