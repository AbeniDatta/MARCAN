'use client';

import { useState, useEffect } from 'react';

interface UserInfo {
    firstName: string;
    lastName: string;
    email: string;
    // Extended user data from signup
    jobTitle?: string;
    companyName?: string;
    businessNumber?: string;
    website?: string;
    phone?: string;
    streetAddress?: string;
    city?: string;
    province?: string;
    aboutUs?: string;
    materials?: string;
    capabilities?: string[];
    certifications?: string[];
    role?: string;
}

// Helper function to get auth state from localStorage
const getAuthState = () => {
    if (typeof window === 'undefined') {
        return { isAuthenticated: false, user: null };
    }
    
    const authStatus = localStorage.getItem('marcan_auth');
    const userInfo = localStorage.getItem('marcan_user');

    let user = null;
    if (userInfo) {
        try {
            user = JSON.parse(userInfo);
        } catch (e) {
            console.error('Error parsing user info:', e);
        }
    }

    return {
        isAuthenticated: authStatus === 'true',
        user,
    };
};

export function useAuth() {
    // Initialize state from localStorage immediately (synchronously)
    const initialState = getAuthState();
    const [isAuthenticated, setIsAuthenticated] = useState(initialState.isAuthenticated);
    const [user, setUser] = useState<UserInfo | null>(initialState.user);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Check auth state on mount and listen for changes
        const checkAuth = () => {
            const state = getAuthState();
            setIsAuthenticated(state.isAuthenticated);
            setUser(state.user);
        };

        // Re-check on mount (in case localStorage was updated)
        checkAuth();

        // Listen for storage changes (for cross-tab sync)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'marcan_auth' || e.key === 'marcan_user') {
                checkAuth();
            }
        };

        // Also listen for custom storage events (for same-tab updates)
        const handleCustomStorageChange = () => {
            checkAuth();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('marcan-auth-change', handleCustomStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('marcan-auth-change', handleCustomStorageChange);
        };
    }, []);

    const login = (userInfo?: UserInfo) => {
        localStorage.setItem('marcan_auth', 'true');
        setIsAuthenticated(true);
        if (userInfo) {
            localStorage.setItem('marcan_user', JSON.stringify(userInfo));
            setUser(userInfo);
        } else {
            // If no userInfo provided, try to get from localStorage
            const state = getAuthState();
            if (state.user) {
                setUser(state.user);
            }
        }
        // Dispatch custom event to sync other components
        window.dispatchEvent(new Event('marcan-auth-change'));
    };

    const logout = () => {
        localStorage.removeItem('marcan_auth');
        localStorage.removeItem('marcan_user');
        setIsAuthenticated(false);
        setUser(null);
        // Dispatch custom event to sync other components
        window.dispatchEvent(new Event('marcan-auth-change'));
    };

    return { isAuthenticated, user, login, logout, isLoading };
}
