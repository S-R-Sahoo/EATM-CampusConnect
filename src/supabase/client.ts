import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project') &&
    !supabaseAnonKey.includes('your-anon-key')
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

if (isSupabaseConfigured()) {
  console.log('✅ Supabase connected successfully:', supabaseUrl);
} else {
  console.info('ℹ️ EATM CampusConnect is running in Local Sandbox mode. To connect live Supabase, configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.');
}
