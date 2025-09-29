import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vzrnxiowtshzspybrxeq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6cm54aW93dHNoenNweWJyeGVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODY0NDEsImV4cCI6MjA3NDI2MjQ0MX0.OE22CHt3jtIEwRiBVxHR4_PGHBQz2H686febIrEGZNQ';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not configured. Data-driven features will be disabled.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })
  : undefined;

export default supabase;
