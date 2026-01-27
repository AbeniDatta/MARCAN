/**
 * Client-side Supabase client using anon key
 * 
 * This client respects Row Level Security (RLS) policies.
 * Safe to use in client components and browser.
 * 
 * For server-side admin operations that bypass RLS, use:
 * @see lib/supabase-server.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types (you can generate these later with Supabase CLI)
export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    user_id: string;
                    company_name: string;
                    business_number: string;
                    website: string | null;
                    phone: string | null;
                    street_address: string | null;
                    city: string | null;
                    province: string | null;
                    about_us: string | null;
                    logo_url: string | null;
                    capabilities: string[] | null;
                    materials: string[] | null;
                    certifications: string[] | null;
                    primary_intent: 'buy' | 'sell' | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
            };
            listings: {
                Row: {
                    id: string;
                    profile_id: string;
                    title: string;
                    description: string | null;
                    price: string | null;
                    category: string | null;
                    badge: string | null;
                    image_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['listings']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['listings']['Insert']>;
            };
            wishlist_requests: {
                Row: {
                    id: string;
                    profile_id: string;
                    company_name: string;
                    category: string;
                    description: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['wishlist_requests']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['wishlist_requests']['Insert']>;
            };
        };
    };
};
