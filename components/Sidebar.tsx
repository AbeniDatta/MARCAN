'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/contexts/I18nContext';
import { useMobileNav } from '@/contexts/MobileNavContext';

interface NavItem {
    href: string;
    label: string;
    icon: string;
    badge?: string;
}

export default function Sidebar() {
    const pathname = usePathname();
    const { isAuthenticated, user, logout, isMounted } = useAuth();
    const [hasSupplierProfile, setHasSupplierProfile] = useState(false);
    const { t } = useI18n();
    const { isOpen, close } = useMobileNav();

    useEffect(() => {
        close();
    }, [pathname, close]);

    const navItems: NavItem[] = [
        { href: '/', label: t('sidebar.home'), icon: 'fa-house' },
        { href: '/directory', label: t('sidebar.directory'), icon: 'fa-address-book' },
        { href: '/shop', label: t('sidebar.shop'), icon: 'fa-store' },
        { href: '/about', label: t('sidebar.about'), icon: 'fa-people-group' },
        { href: '/help', label: t('sidebar.help'), icon: 'fa-circle-question' },
        { href: '/contact', label: t('sidebar.contact'), icon: 'fa-envelope' },
    ];

    // Group navigation links for clearer IA:
    // - First 3: Platform
    // - Last 3: Support & Info
    const platformItems = navItems.slice(0, 3);
    const supportItems = navItems.slice(3);

    // Check if user has a supplier profile in the database
    useEffect(() => {
        if (isMounted && isAuthenticated && user?.email) {
            fetch(`/api/profiles?userId=${encodeURIComponent(user.email)}`)
                .then((res) => {
                    if (!res.ok) {
                        if (res.status === 404) {
                            return null;
                        }
                        throw new Error('Failed to fetch profile');
                    }
                    return res.json();
                })
                .then((profile) => {
                    if (profile?.id) {
                        setHasSupplierProfile(true);
                    } else {
                        setHasSupplierProfile(false);
                    }
                })
                .catch((err) => {
                    console.error('Error checking supplier profile:', err);
                    // Fallback to localStorage role check
                    setHasSupplierProfile(user?.role === 'supplier');
                });
        } else {
            setHasSupplierProfile(false);
        }
    }, [isMounted, isAuthenticated, user?.email, user?.role]);

    const isActive = (href: string) => {
        if (href === '/') {
            return pathname === '/';
        }
        const hrefPath = href.split('?')[0];
        return pathname.startsWith(hrefPath);
    };

    return (
        <>
            <button
                type="button"
                aria-label={t('layout.closeMenuAria')}
                className={`fixed inset-0 z-[35] bg-black/65 backdrop-blur-sm transition-opacity lg:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={close}
            />

            <aside
                className={`glass-panel flex flex-col justify-between py-6 sm:py-8 px-3 sm:px-4 transition-transform duration-300 ease-out shrink-0
          fixed z-[40] inset-y-0 left-0 w-[min(20rem,calc(100vw-1rem))] max-w-[min(20rem,calc(100vw-1rem))]
          shadow-2xl lg:shadow-none lg:relative lg:z-20 lg:w-72 lg:max-w-none lg:translate-x-0
          ${isOpen ? 'translate-x-0 max-lg:pointer-events-auto' : '-translate-x-full lg:translate-x-0 max-lg:pointer-events-none'}`}
            >
                <div className="flex items-start justify-between gap-2 lg:justify-start mb-6 lg:mb-10">
                    <Link href="/" onClick={close} className="flex items-center gap-4 px-2 cursor-pointer group min-w-0">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-neon group-hover:scale-105 transition-transform duration-300 relative bg-transparent overflow-hidden shrink-0">
                            <img
                                src="/images/marcan-potential-logo.png"
                                alt="Marcan Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-heading font-bold text-lg sm:text-xl text-white tracking-widest uppercase truncate">Marcan</h1>
                        </div>
                    </Link>
                    <button
                        type="button"
                        className="lg:hidden shrink-0 w-10 h-10 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
                        onClick={close}
                        aria-label={t('layout.closeMenuAria')}
                    >
                        <i className="fa-solid fa-xmark text-lg" aria-hidden />
                    </button>
                </div>

            {/* Nav Links */}
            <nav className="flex-grow space-y-2">
                <div className="pt-2 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Platform
                </div>
                {platformItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <div key={item.href}>
                            <Link
                                href={item.href}
                                onClick={close}
                                className={`nav-item w-full flex items-center gap-4 px-4 py-4 rounded-xl ${active ? 'text-white' : 'text-slate-400'} hover:text-white hover:bg-white/5 transition-all duration-300 group relative overflow-hidden`}
                            >
                                <div
                                    className={`absolute inset-0 bg-marcan-red/10 transition-transform duration-300 ${
                                        active ? 'translate-x-0' : 'translate-x-[-100%] group-hover:translate-x-0'
                                    }`}
                                />
                                <i className={`fa-solid ${item.icon} text-xl w-6 text-center shrink-0`}></i>
                                <span className="font-semibold text-sm tracking-wide truncate">{item.label}</span>
                                {item.badge && (
                                    <span className="flex ml-auto bg-marcan-red/20 text-marcan-red border border-marcan-red/50 text-[10px] font-bold px-2 py-0.5 rounded shadow-neon shrink-0">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        </div>
                    );
                })}

                <div className="pt-4 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Support &amp; Info
                </div>
                {supportItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <div key={item.href}>
                            <Link
                                href={item.href}
                                onClick={close}
                                className={`nav-item w-full flex items-center gap-4 px-4 py-4 rounded-xl ${active ? 'text-white' : 'text-slate-400'} hover:text-white hover:bg-white/5 transition-all duration-300 group relative overflow-hidden`}
                            >
                                <div
                                    className={`absolute inset-0 bg-marcan-red/10 transition-transform duration-300 ${
                                        active ? 'translate-x-0' : 'translate-x-[-100%] group-hover:translate-x-0'
                                    }`}
                                />
                                <i className={`fa-solid ${item.icon} text-xl w-6 text-center shrink-0`}></i>
                                <span className="font-semibold text-sm tracking-wide truncate">{item.label}</span>
                                {item.badge && (
                                    <span className="flex ml-auto bg-marcan-red/20 text-marcan-red border border-marcan-red/50 text-[10px] font-bold px-2 py-0.5 rounded shadow-neon shrink-0">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        </div>
                    );
                })}

            </nav>

            {/* User Panel */}
            <div className="mt-auto pt-6 border-t border-white/5 space-y-2">
                {isMounted && isAuthenticated && user ? (
                    <>
                        <div className="w-full glass-card p-4 rounded-xl flex items-center gap-4">
                            <div className="text-left min-w-0 flex-1">
                                <span className="text-medium font-bold text-white text-center">
                                    {t('sidebar.welcomeUser').replace('{name}', user.firstName)}
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                close();
                                logout();
                            }}
                            className="w-full glass-card p-4 rounded-xl flex items-center gap-4 group hover:border-red-500/50 transition-colors duration-300 text-left"
                        >
                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-red-400 border border-red-500/30">
                                <i className="fa-solid fa-right-from-bracket"></i>
                            </div>
                            <div className="text-left min-w-0">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('sidebar.signOutLabel')}</div>
                                <div className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                                    {t('sidebar.logout')}
                                </div>
                            </div>
                        </button>
                    </>
                ) : isMounted ? (
                    <Link
                        href="/signup"
                        onClick={close}
                        className="w-full glass-card p-4 rounded-xl flex items-center gap-4 group hover:border-marcan-red/50 transition-colors duration-300"
                    >
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-marcan-red border border-marcan-red/30 shadow-neon">
                            <i className="fa-solid fa-user-plus"></i>
                        </div>
                        <div className="text-left min-w-0">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('sidebar.joinMarcan')}</div>
                            <div className="text-sm font-bold text-white group-hover:text-marcan-red transition-colors">
                                {t('sidebar.signUp')}
                            </div>
                        </div>
                    </Link>
                ) : null}
            </div>
        </aside>
        </>
    );
}
