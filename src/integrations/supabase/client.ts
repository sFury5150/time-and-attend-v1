// Supabase Client Configuration
// Uses environment variables for flexibility across environments
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

<<<<<<< HEAD
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://cjpyypjmtjghtspvmjld.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_e4mAW35jsDm8IYXQzMhJMA_CbbHIxAX";

// Validate that we have the required environment variables
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('Missing Supabase environment variables. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}
=======
const SUPABASE_URL = "https://cjpyypjmtjghtspvmjld.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_e4mAW35jsDm8IYXQzMhJMA_CbbHIxAX";
>>>>>>> 4508deae0dcf08954e3042b19b95639bb0c21498

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});