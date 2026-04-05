import { createClient } from '@supabase/supabase-js';

// Bu değerler normalde .env dosyasından gelmeli.
// AI Studio ortamında Supabase kurulumu yapıldığında otomatik enjekte edilir.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('Supabase URL is not configured. Please set VITE_SUPABASE_URL in your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
