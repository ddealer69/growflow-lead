import { createClient } from '@supabase/supabase-js';

// Supabase client specifically for user lookups
const SUPABASE_URL = 'https://abwlrumylqkervfaadhl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFid2xydW15bHFrZXJ2ZmFhZGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NzY4MTcsImV4cCI6MjA3NTM1MjgxN30.snPdXlmB8q9zRy3abOaXEDstanVYX3_WFcWkDXdwMuo';

export const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);