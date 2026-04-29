import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Utility to sync Supabase session to the legacy token storage 
 * used by the fetch interceptor and backend.
 */
export async function syncSupabaseToken() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    localStorage.setItem('iarchive_token', session.access_token);
    return session.access_token;
  }
  return null;
}
