'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';

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
    materials?: string | string[]; // Can be string (comma-separated) or array
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
    // Always start with false/null to match server-side rendering (prevent hydration errors)
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<UserInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // Mark as mounted (client-side only)
        setIsMounted(true);

        // Check auth state on mount and listen for changes
        const checkAuth = () => {
            const state = getAuthState();
            setIsAuthenticated(state.isAuthenticated);
            setUser(state.user);
            setIsLoading(false);
        };

        // Listen to Firebase Auth state changes
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                // User is signed in via Firebase
                setIsAuthenticated(true);

                // Get user data from localStorage (contains extended profile data)
                const storedUserData = typeof window !== 'undefined' ? localStorage.getItem('marcan_user') : null;
                if (storedUserData) {
                    try {
                        const parsed = JSON.parse(storedUserData);
                        setUser(parsed);
                    } catch (e) {
                        // If parsing fails, create basic user info from Firebase
                        const nameParts = firebaseUser.displayName?.split(' ') || [];
                        setUser({
                            firstName: nameParts[0] || 'User',
                            lastName: nameParts.slice(1).join(' ') || 'User',
                            email: firebaseUser.email || '',
                        });
                    }
                } else {
                    // No stored data, create basic user info from Firebase
                    const nameParts = firebaseUser.displayName?.split(' ') || [];
                    setUser({
                        firstName: nameParts[0] || 'User',
                        lastName: nameParts.slice(1).join(' ') || 'User',
                        email: firebaseUser.email || '',
                    });
                }

                // Ensure localStorage is in sync
                localStorage.setItem('marcan_auth', 'true');
            } else {
                // User is signed out
                setIsAuthenticated(false);
                setUser(null);
                localStorage.removeItem('marcan_auth');
                localStorage.removeItem('marcan_user');
            }
            setIsLoading(false);
        });

        // Also check localStorage state (for backward compatibility)
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
            unsubscribe(); // Unsubscribe from Firebase Auth listener
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

    const logout = async () => {
        // Sign out from Firebase
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error('Error signing out from Firebase:', error);
        }

        // Clear localStorage
        localStorage.removeItem('marcan_auth');
        localStorage.removeItem('marcan_user');
        setIsAuthenticated(false);
        setUser(null);

        // Dispatch custom event to sync other components
        window.dispatchEvent(new Event('marcan-auth-change'));
    };

    return { isAuthenticated, user, login, logout, isLoading, isMounted };
}
