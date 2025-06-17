// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Loaded Supabase URL:", supabaseUrl); // Add this line
console.log("Loaded Supabase Anon Key:", supabaseAnonKey ? "Loaded (not displayed)" : "Not Loaded!"); // Add this line

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing! Check your .env file and VITE_ prefix.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
});