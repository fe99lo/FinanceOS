import { createClient } from '@supabase/supabase-js';

// Vite strictly requires 'import.meta.env' and the 'VITE_' prefix
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase Environment Variables! Check Netlify settings.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);