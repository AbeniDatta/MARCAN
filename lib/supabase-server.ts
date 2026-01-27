/**
 * Server-side Supabase client using service role key
 * 
 * WARNING: This client bypasses Row Level Security (RLS) policies.
 * Only use this in:
 * - API routes (app/api/*)
 * - Server Components
 * - Server Actions
 * 
 * NEVER import this in client components or expose to the browser.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase server-side environment variables');
}

/**
 * Server-side Supabase client with service role key
 * This bypasses RLS and should only be used for admin operations
 */
export const supabaseAdmin = createClient<Database>(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);
