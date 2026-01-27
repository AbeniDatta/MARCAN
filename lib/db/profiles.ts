import { supabase } from '../supabase';
import type { Database } from '../supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export async function getProfile(userId: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) throw error;
    return data;
}

export async function createProfile(profile: ProfileInsert) {
    const { data, error } = await supabase
        .from('profiles')
        .insert(profile)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateProfile(userId: string, updates: ProfileUpdate) {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getAllProfiles() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}
