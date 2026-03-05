'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/contexts/I18nContext';

interface HeaderProps {
    breadcrumb?: string;
}

interface ProfileData {
    city?: string | null;
    province?: string | null;
}

export default function Header({ breadcrumb = 'Overview' }: HeaderProps) {
    const { isAuthenticated, user, isMounted } = useAuth();
    const { lang, setLang, t } = useI18n();
    const [profileData, setProfileData] = useState<ProfileData | null>(null);

    // Fetch profile data from database when user is authenticated
    useEffect(() => {
        if (isMounted && isAuthenticated && user?.email) {
            const fetchProfile = async () => {
                try {
                    const response = await fetch(`/api/profiles?userId=${encodeURIComponent(user.email)}`);
                    if (response.ok) {
                        const data = await response.json();
                        setProfileData({
                            city: data.city,
                            province: data.province,
                        });
                    }
                } catch (error) {
                    console.error('Error fetching profile:', error);
                    // Fallback to localStorage data if fetch fails
                    setProfileData({
                        city: user.city,
                        province: user.province,
                    });
                }
            };
            fetchProfile();
        } else {
            setProfileData(null);
        }
    }, [isMounted, isAuthenticated, user?.email]);

    // Use database profile data if available, otherwise fallback to localStorage user data
    const displayCity = profileData?.city ?? user?.city;
    const displayProvince = profileData?.province ?? user?.province;

    return (
        <header className="h-20 px-8 flex justify-between items-center border-b border-white/5 bg-marcan-dark/30 backdrop-blur-sm z-30">
                {/* Left: Context */}
                <div className="flex items-center gap-3">
                    <Link href="/" className="font-heading font-bold text-white text-lg tracking-tight hover:text-marcan-red transition-colors cursor-pointer">
                        {t('header.brand')}
                    </Link>
                    <span className="text-slate-600 text-lg">/</span>
                    <span className="text-slate-400 text-sm font-medium">
                        {breadcrumb === 'Home' ? t('header.breadcrumbHome') : breadcrumb}
                    </span>
                </div>

                {/* Right: Relevance & Actions */}
                <div className="flex items-center gap-6">
                    {/* Location Selector - Only show when logged in */}
                    {isMounted && isAuthenticated && user && (displayCity || displayProvince) && (
                        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white cursor-pointer transition group">
                            <i className="fa-solid fa-location-dot text-marcan-red group-hover:shadow-neon transition-shadow"></i>
                            <span>
                                {displayCity && displayProvince
                                    ? `${displayCity}, ${displayProvince}`
                                    : displayCity || displayProvince || 'Location'}
                            </span>
                            <i className="fa-solid fa-chevron-down text-[10px] ml-1 opacity-50"></i>
                        </div>
                    )}

                    {/* Language Toggle (i18n context only) */}
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <button
                            type="button"
                            onClick={() => setLang('en')}
                            className={`${lang === 'en' ? 'text-white' : 'hover:text-marcan-red'} cursor-pointer transition`}
                        >
                            EN
                        </button>
                        <span className="opacity-30">|</span>
                        <button
                            type="button"
                            onClick={() => setLang('fr')}
                            className={`${lang === 'fr' ? 'text-white' : 'hover:text-marcan-red'} cursor-pointer transition`}
                        >
                            FR
                        </button>
                    </div>

                    <div className="h-4 w-[1px] bg-white/10"></div>

                    {/* Actions */}
                    <div className="flex gap-3 items-center">
                        {isMounted && isAuthenticated && user ? (
                            <Link
                                href="/my-account"
                                className="w-9 h-9 rounded-lg bg-gradient-to-br from-marcan-red to-red-900 flex items-center justify-center text-white text-xs font-bold shadow-neon hover:scale-105 transition-transform border border-white/10"
                                title="My Account"
                            >
                                {user.firstName.charAt(0).toUpperCase()}
                                {user.lastName?.charAt(0).toUpperCase() || ''}
                            </Link>
                        ) : isMounted ? (
                            <Link
                                href="/login"
                                className="px-5 py-2 rounded-lg bg-white/10 hover:bg-marcan-red border border-white/10 flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-neon transition-all"
                            >
                                Login
                            </Link>
                        ) : (
                            <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/10"></div>
                        )}
                    </div>
                </div>
            </header>
    );
}
