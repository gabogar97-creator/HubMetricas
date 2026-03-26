import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

let supabaseClient: any = null;

export const getSupabase = () => {
  console.log('--- getSupabase function starting now (final check 2) ---');
  console.log('--- getSupabase function starting now (final check) ---');
  console.log('--- getSupabase function starting now ---');
  console.log('--- getSupabase function starting ---');
  console.log('Starting getSupabase function...');
  console.log('getSupabase function called...');
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    console.log('SUPABASE_URL:', supabaseUrl ? 'Defined' : 'Undefined');
    console.log('SUPABASE_ANON_KEY:', supabaseKey ? 'Defined' : 'Undefined');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase URL or Key is missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment variables.');
      throw new Error('Supabase URL or Key is missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment variables.');
    }
    console.log('Initializing Supabase client with URL:', supabaseUrl);
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
};

// For backward compatibility in routes.ts if needed, but we should update routes.ts
export const supabase = {
  from: (table: string) => getSupabase().from(table),
  auth: {
    get session() { return getSupabase().auth.session; },
    get user() { return getSupabase().auth.user; }
  }
};
