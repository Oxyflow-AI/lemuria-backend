import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './app.config';
import { logger } from '../utils/logger';

let supabase: SupabaseClient;
let supabaseAdmin: SupabaseClient;

export const initializeSupabase = (): SupabaseClient => {
  if (!config.supabase.url || !config.supabase.anonKey) {
    throw new Error('Supabase URL and anon key are required');
  }

  supabase = createClient(config.supabase.url, config.supabase.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false
    }
  });

  // Initialize admin client with service role key
  if (config.supabase.serviceRoleKey) {
    supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    logger.info('Supabase admin client initialized successfully');
  }

  logger.info('Supabase client initialized successfully');
  return supabase;
};

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    return initializeSupabase();
  }
  return supabase;
};

export const getSupabaseAdminClient = (): SupabaseClient => {
  if (!supabaseAdmin) {
    initializeSupabase();
  }
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available - service role key missing');
  }
  return supabaseAdmin;
};

export { supabase };