// src/lib/supabase.ts
// Supabase client configuration for LeadHub
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = !!(supabaseUrl && supabaseKey);

// If env vars are missing, use a placeholder so the app still renders
// — Auth screen will show a config error instead of a blank page
export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

export type { User, Session } from '@supabase/supabase-js';
