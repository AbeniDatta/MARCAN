import { supabase } from '../supabase';
import type { Database } from '../supabase';

type Listing = Database['public']['Tables']['listings']['Row'];
type ListingInsert = Database['public']['Tables']['listings']['Insert'];
type ListingUpdate = Database['public']['Tables']['listings']['Update'];

export async function getListing(id: string) {
    const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

export async function getAllListings() {
    const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function getListingsByProfile(profileId: string) {
    const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function createListing(listing: ListingInsert) {
    const { data, error } = await supabase
        .from('listings')
        .insert(listing)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateListing(id: string, updates: ListingUpdate) {
    const { data, error } = await supabase
        .from('listings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteListing(id: string) {
    const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
