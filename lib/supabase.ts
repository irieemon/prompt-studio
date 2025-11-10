import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { CopyrightPattern } from '@/types/copyright';

// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      copyright_patterns: {
        Row: CopyrightPattern;
        Insert: Omit<CopyrightPattern, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CopyrightPattern, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}

/**
 * Creates a Supabase client for server-side operations
 * Uses service role key for admin operations
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);
}

/**
 * Creates a Supabase client for client-side operations
 * Uses anon key for public access
 */
export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
}
