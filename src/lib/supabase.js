// ==============================================================================
// SpendWise - Supabase Client Setup
// ==============================================================================
// Description:
// Initializes and exports the Supabase client instance using environment
// variables defined in .env. It includes verification helpers to warn the
// developer or user if credentials are missing or default placeholders.
// ==============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials have been replaced with real project keys
export const isSupabaseConfigured = () => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    supabaseUrl !== 'https://your-project-id.supabase.co' &&
    supabaseAnonKey !== 'your-anon-public-key-here'
  );
};

if (!isSupabaseConfigured()) {
  console.warn(
    '⚠️ SpendWise Notice: Supabase URL or Anon Key is missing or using placeholders in .env file. Please add your credentials in .env.'
  );
}

// Fallback dummy values prevent instant crash if user hasn't filled .env yet
const validUrl = isSupabaseConfigured() ? supabaseUrl : 'https://placeholder.supabase.co';
const validKey = isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-key';

export const supabase = createClient(validUrl, validKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
