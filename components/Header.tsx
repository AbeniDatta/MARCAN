'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
    breadcrumb?: string;
}

export default function Header({ breadcrumb = 'Overview' }: HeaderProps) {
    const { isAuthenticated, user } = useAuth();
    return (
        <header className="h-20 px-8 flex justify-between items-center border-b border-white/5 bg-marcan-dark/30 backdrop-blur-sm z-30">
            {/* Left: Context */}
            <div className="flex items-center gap-3">
                <h2 className="font-heading font-bold text-white text-lg tracking-tight">Marcan Platform</h2>
                <span className="text-slate-600 text-lg">/</span>
                <span className="text-slate-400 text-sm font-medium">{breadcrumb}</span>
            </div>

            {/* Right: Relevance & Actions */}
            <div className="flex items-center gap-6">
                {/* Location Selector */}
                <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white cursor-pointer transition group">
                    <i className="fa-solid fa-location-dot text-marcan-red group-hover:shadow-neon transition-shadow"></i>
                    <span>Ontario, CA</span>
                    <i className="fa-solid fa-chevron-down text-[10px] ml-1 opacity-50"></i>
                </div>

                {/* Language Toggle */}
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <span className="text-white cursor-pointer hover:text-marcan-red transition">EN</span>
                    <span className="opacity-30">|</span>
                    <span className="cursor-pointer hover:text-white transition">FR</span>
                </div>

                <div className="h-4 w-[1px] bg-white/10"></div>

                {/* Actions */}
                <div className="flex gap-3 items-center">
                    <Link
                        href="/help"
                        className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/5 transition text-slate-400 hover:text-white"
                        title="Support Center / Help"
                    >
                        <i className="fa-regular fa-circle-question"></i>
                    </Link>
                    {isAuthenticated && user ? (
                        <Link
                            href="/my-account"
                            className="w-9 h-9 rounded-lg bg-gradient-to-br from-marcan-red to-red-900 flex items-center justify-center text-white text-xs font-bold shadow-neon hover:scale-105 transition-transform border border-white/10"
                            title="My Account"
                        >
                            {user.firstName.charAt(0).toUpperCase()}
                            {user.lastName?.charAt(0).toUpperCase() || ''}
                        </Link>
                    ) : (
                        <Link
                            href="/login"
                            className="px-5 py-2 rounded-lg bg-white/10 hover:bg-marcan-red border border-white/10 flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-neon transition-all"
                        >
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
