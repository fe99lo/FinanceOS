// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// We use import.meta.env for Vite projects (instead of process.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// This creates the single secure connection we use across all dashboards
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
