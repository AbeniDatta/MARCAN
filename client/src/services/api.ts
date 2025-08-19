import axios from 'axios';
import { auth } from '@/firebase';

// Uncomment this for production:
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5050/api');
// Uncomment this for local development:
//const API_URL = 'http://localhost:5050/api';


// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

// Add request interceptor to include auth token
api.interceptors.request.use(async (config) => {
    try {
        const user = auth.currentUser;
        console.log('=== API REQUEST DEBUG ===');
        console.log('Current user:', user ? user.email : 'No user');
        console.log('Request URL:', config.url);
        console.log('Request method:', config.method);

        if (user) {
            const token = await user.getIdToken(true);
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Token added to request');
        } else {
            console.log('No user found, no token added');
        }
        return config;
    } catch (error) {
        console.error('Token error:', error);
        return config;
    }
});

// Add response interceptor for better error handling
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        throw new Error(error.response?.data?.error || error.message || 'Network error occurred');
    }
);

// Types
export interface Listing {
    id: number;
    title: string;
    description: string;
    price: number;
    companyName: string;
    imageUrl?: string;
    fileUrl?: string;
    tags: string[];
    categories: string[];
    city?: string;
    capacity?: string;
    userId: number;
    createdAt: string;
    timestamp?: number;
    isDraft?: boolean;
    user?: {
        id: number;
        name: string;
        email: string;
        firebaseUid: string;
    };
}

export interface UserProfile {
    id: number;
    name: string;
    email: string;
    firebaseUid: string;
    companyName?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    website?: string;
    description?: string;
    phone?: string;
    logoUrl?: string;
    chatbotName?: string;
    createdAt: string;
    updatedAt: string;
}

// Type for creating/updating listings (companyName is set automatically by server)
export type ListingInput = Omit<Listing, 'id' | 'createdAt' | 'userId' | 'companyName'>;

// Type for profile data
export type ProfileInput = Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>;

// API functions
export const listingApi = {
    // Create a new listing
    createListing: async (data: ListingInput) => {
        try {
            const response = await api.post<Listing>('/listings', data);
            return response.data;
        } catch (error) {
            console.error('Error creating listing:', error);
            throw error;
        }
    },

    // Get all listings
    getAllListings: async (sortBy: string = "most-relevant") => {
        try {
            const response = await api.get<Listing[]>('/listings', {
                params: { sortBy },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching listings:', error);
            throw error;
        }
    },

    // Search listings
    searchListings: async (query: string) => {
        try {
            const url = `/listings/search?query=${encodeURIComponent(query)}`;
            console.log('Making search request to:', url);
            const response = await api.get<Listing[]>(url);
            console.log('Search response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error searching listings:', error);
            throw error;
        }
    },

    // Get a specific listing
    getListingById: async (id: number) => {
        try {
            const response = await api.get<Listing>(`/listings/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching listing:', error);
            throw error;
        }
    },

    // Get listings by user
    getListingsByUser: async (userId: number) => {
        try {
            const response = await api.get<Listing[]>(`/listings/user/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching user listings:', error);
            throw error;
        }
    },

    // Get listings by Firebase UID
    getListingsByFirebaseUid: async (firebaseUid: string) => {
        try {
            const response = await api.get<Listing[]>(`/listings/firebase-uid/${firebaseUid}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching listings by Firebase UID:', error);
            throw error;
        }
    },

    // Get current user's listings
    getMyListings: async () => {
        try {
            const response = await api.get<Listing[]>('/listings/my-listings');
            return response.data;
        } catch (error) {
            console.error('Error fetching my listings:', error);
            throw error;
        }
    },

    getFilterOptions: async () => {
        try {
            const response = await api.get<{ categories: string[]; tags: string[]; locations: string[] }>('/listings/filters');
            return response.data;
        } catch (error) {
            console.error('Error fetching filter options:', error);
            throw error;
        }
    },

    // Update a listing
    updateListing: async (id: number, data: Partial<Listing>) => {
        try {
            console.log('=== UPDATE LISTING API CALL ===');
            console.log('Sending update request for ID:', id);
            console.log('Data being sent:', data);

            const response = await api.put<Listing>(`/listings/${id}`, data);
            console.log('Update response received:', response);
            console.log('Response data:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Error updating listing:', error);
            console.error('Error details:', error.response?.data);
            throw error;
        }
    },

    // Delete a listing
    deleteListing: async (id: number) => {
        try {
            await api.delete(`/listings/${id}`);
        } catch (error) {
            console.error('Error deleting listing:', error);
            throw error;
        }
    },

    // Save listing as draft
    saveDraft: async (data: ListingInput) => {
        try {
            const response = await api.post<Listing>('/listings/draft', { ...data, isDraft: true });
            return response.data;
        } catch (error) {
            console.error('Error saving draft:', error);
            throw error;
        }
    },

    // Get current user's drafts
    getMyDrafts: async () => {
        try {
            const response = await api.get<Listing[]>('/listings/my-drafts');
            return response.data;
        } catch (error) {
            console.error('Error fetching my drafts:', error);
            throw error;
        }
    },

    // Publish draft
    publishDraft: async (id: number) => {
        try {
            const response = await api.put<Listing>(`/listings/${id}/publish`, { isDraft: false });
            return response.data;
        } catch (error) {
            console.error('Error publishing draft:', error);
            throw error;
        }
    },

    saveListing: async (listingId: number) => {
        const response = await api.post('/listings/save', { listingId });
        return response.data;
    },

    // ✅ NEW: Unsave listing
    unsaveListing: async (listingId: number) => {
        const response = await api.post('/listings/unsave', { listingId });
        return response.data;
    },

    // ✅ NEW: Get saved listings
    getSavedListings: async () => {
        const response = await api.get<Listing[]>('/listings/saved');
        return response.data;
    },
};

export const profileApi = {
    // Create or update user profile
    createOrUpdateProfile: async (data: ProfileInput) => {
        try {
            console.log('Making profile creation request to:', `${API_URL}/users/profile`);
            console.log('Profile data:', data);
            const response = await api.post<UserProfile>('/users/profile', data);
            console.log('Profile creation response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error creating/updating profile:', error);
            throw error;
        }
    },

    // Get user profile
    getUserProfile: async (firebaseUid: string) => {
        try {
            console.log('Making profile fetch request to:', `${API_URL}/users/profile/${firebaseUid}`);
            const response = await api.get<UserProfile>(`/users/profile/${firebaseUid}`);
            console.log('Profile fetch response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    },

    // Get user profile by user ID (for supplier profiles)
    getUserProfileById: async (userId: number) => {
        try {
            const response = await api.get<UserProfile>(`/users/profile/id/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching user profile by ID:', error);
            throw error;
        }
    },
};

export const getAllUsers = () =>
  api.get<UserProfile[]>("/users", { params: { activeOnly: true } });
export const deleteUserById = (userId: number) => api.delete(`/users/admin/${userId}`);
export const deleteListingById = (listingId: number) => api.delete(`/listings/admin/${listingId}`);

export { api };