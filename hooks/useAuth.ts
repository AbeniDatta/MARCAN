'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { fetchAccountRoleFromApi } from '@/lib/accountRole';

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
    selectedIcon?: string; // Icon selected for company directory
    logoUrl?: string; // Uploaded logo URL
    role?: string;
}

const deriveNameFromEmail = (email?: string | null) => {
    const safeEmail = (email || '').trim();
    if (!safeEmail) return { firstName: 'There', lastName: '' };
    const local = safeEmail.split('@')[0] || '';
    const token = (local.split(/[._-]+/).find(Boolean) || local).trim();
    const firstName = token ? token.charAt(0).toUpperCase() + token.slice(1) : 'There';
    return { firstName, lastName: '' };
};

const deriveNameFromDisplayName = (displayName?: string | null) => {
    const raw = (displayName || '').trim();
    if (!raw) return null;
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return null;
    return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' '),
    };
};

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

                let baseUser: UserInfo;

                // Get user data from localStorage (contains extended profile data)
                const storedUserData = typeof window !== 'undefined' ? localStorage.getItem('marcan_user') : null;
                if (storedUserData) {
                    try {
                        baseUser = JSON.parse(storedUserData);
                    } catch (e) {
                        const fromDisplay = deriveNameFromDisplayName(firebaseUser.displayName);
                        const fromEmail = deriveNameFromEmail(firebaseUser.email);
                        baseUser = {
                            firstName: fromDisplay?.firstName || fromEmail.firstName,
                            lastName: fromDisplay?.lastName || fromEmail.lastName,
                            email: firebaseUser.email || '',
                        };
                    }
                } else {
                    const fromDisplay = deriveNameFromDisplayName(firebaseUser.displayName);
                    const fromEmail = deriveNameFromEmail(firebaseUser.email);
                    baseUser = {
                        firstName: fromDisplay?.firstName || fromEmail.firstName,
                        lastName: fromDisplay?.lastName || fromEmail.lastName,
                        email: firebaseUser.email || '',
                    };
                }

                // Ensure email matches Firebase (source of truth for signed-in identity)
                if (firebaseUser.email) {
                    baseUser = { ...baseUser, email: firebaseUser.email };
                }

                setUser(baseUser);
                localStorage.setItem('marcan_auth', 'true');

                const emailForRole = firebaseUser.email || baseUser.email;
                if (emailForRole) {
                    void (async () => {
                        try {
                            const apiRole = await fetchAccountRoleFromApi(emailForRole);
                            const merged: UserInfo = { ...baseUser, email: emailForRole, role: apiRole ?? baseUser.role };
                            setUser(merged);
                            localStorage.setItem('marcan_user', JSON.stringify(merged));
                            window.dispatchEvent(new Event('marcan-auth-change'));
                        } catch {
                            // keep baseUser / existing role
                        }
                    })();
                }
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

    const login = async (userInfo?: UserInfo) => {
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

        // Best-effort reactivation of any deactivated profiles for this user
        try {
            const email = userInfo?.email || getAuthState().user?.email;
            if (email) {
                await fetch('/api/account', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId: email, action: 'reactivate' }),
                });
            }
        } catch (err) {
            console.warn('Failed to reactivate account on login:', err);
        }
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
