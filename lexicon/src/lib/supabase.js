import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not found in environment variables. Auth features will be disabled.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || ''
);
