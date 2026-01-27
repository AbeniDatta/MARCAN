import { supabase } from '../supabase';
import type { Database } from '../supabase';

type WishlistRequest = Database['public']['Tables']['wishlist_requests']['Row'];
type WishlistRequestInsert = Database['public']['Tables']['wishlist_requests']['Insert'];
type WishlistRequestUpdate = Database['public']['Tables']['wishlist_requests']['Update'];

export async function getWishlistRequest(id: string) {
    const { data, error } = await supabase
        .from('wishlist_requests')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

export async function getAllWishlistRequests() {
    const { data, error } = await supabase
        .from('wishlist_requests')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function getWishlistRequestsByProfile(profileId: string) {
    const { data, error } = await supabase
        .from('wishlist_requests')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function createWishlistRequest(request: WishlistRequestInsert) {
    const { data, error } = await supabase
        .from('wishlist_requests')
        .insert(request)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateWishlistRequest(id: string, updates: WishlistRequestUpdate) {
    const { data, error } = await supabase
        .from('wishlist_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteWishlistRequest(id: string) {
    const { error } = await supabase
        .from('wishlist_requests')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
