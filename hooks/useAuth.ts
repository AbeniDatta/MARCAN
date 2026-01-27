'use client';

import { useState, useEffect } from 'react';

interface UserInfo {
    firstName: string;
    email: string;
}

export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<UserInfo | null>(null);

    useEffect(() => {
        // Check if user is logged in (stored in localStorage)
        const authStatus = localStorage.getItem('marcan_auth');
        const userInfo = localStorage.getItem('marcan_user');

        setIsAuthenticated(authStatus === 'true');
        if (userInfo) {
            try {
                setUser(JSON.parse(userInfo));
            } catch (e) {
                console.error('Error parsing user info:', e);
            }
        }
    }, []);

    const login = (userInfo?: UserInfo) => {
        localStorage.setItem('marcan_auth', 'true');
        setIsAuthenticated(true);
        if (userInfo) {
            localStorage.setItem('marcan_user', JSON.stringify(userInfo));
            setUser(userInfo);
        }
    };

    const logout = () => {
        localStorage.removeItem('marcan_auth');
        localStorage.removeItem('marcan_user');
        setIsAuthenticated(false);
        setUser(null);
    };

    return { isAuthenticated, user, login, logout };
}
