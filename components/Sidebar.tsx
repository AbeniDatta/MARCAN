'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
    href: string;
    label: string;
    icon: string;
    badge?: string;
}

export default function Sidebar() {
    const pathname = usePathname();
    const { isAuthenticated, user, logout, isMounted } = useAuth();

    const navItems: NavItem[] = [
        { href: '/', label: 'Home', icon: 'fa-house' },
        { href: '/about', label: 'About Us', icon: 'fa-shield-halved' },
        { href: '/directory', label: 'Directory', icon: 'fa-address-book' },
        { href: '/wishlist', label: 'Buyer Wishlist', icon: 'fa-bullhorn' },
        { href: '/marketplace', label: 'Supplier Listings', icon: 'fa-shop' },
        { href: '/contact', label: 'Contact Us', icon: 'fa-envelope' },
    ];

    const isActive = (href: string) => {
        if (href === '/') {
            return pathname === '/';
        }
        return pathname.startsWith(href);
    };

    return (
        <aside className="relative z-20 w-20 lg:w-72 glass-panel flex flex-col justify-between py-8 px-4 transition-all duration-300">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-4 px-2 mb-10 cursor-pointer group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-marcan-red to-red-900 flex items-center justify-center shadow-neon group-hover:scale-105 transition-transform duration-300">
                    <span className="font-heading font-black text-2xl text-white">M</span>
                </div>
                <div className="hidden lg:block">
                    <h1 className="font-heading font-bold text-xl text-white tracking-widest uppercase">Marcan</h1>
                </div>
            </Link>

            {/* Nav Links */}
            <nav className="flex-grow space-y-2">
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-item w-full flex items-center gap-4 px-4 py-4 rounded-xl ${active ? 'text-white' : 'text-slate-400'
                                } hover:text-white hover:bg-white/5 transition-all duration-300 group relative overflow-hidden`}
                        >
                            <div
                                className={`absolute inset-0 bg-marcan-red/10 transition-transform duration-300 ${active ? 'translate-x-0' : 'translate-x-[-100%] group-hover:translate-x-0'
                                    }`}
                            />
                            <i className={`fa-solid ${item.icon} text-xl w-6 text-center`}></i>
                            <span className="hidden lg:block font-semibold text-sm tracking-wide">{item.label}</span>
                            {item.badge && (
                                <span className="hidden lg:flex ml-auto bg-marcan-red/20 text-marcan-red border border-marcan-red/50 text-[10px] font-bold px-2 py-0.5 rounded shadow-neon">
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Panel */}
            <div className="mt-auto pt-6 border-t border-white/5 space-y-2">
                {isMounted && isAuthenticated && user ? (
                    <>
                        <Link
                            href="/my-account"
                            className="w-full glass-card p-4 rounded-xl flex items-center gap-4 group hover:border-marcan-red/50 transition-colors duration-300"
                        >
                            <div className="hidden lg:block text-center whitespace-nowrap">
                                <span className="text-medium font-bold text-white group-hover:text-marcan-red transition-colors text-center">
                                    Welcome {user.firstName}!
                                </span>
                            </div>
                        </Link>
                        <button
                            onClick={logout}
                            className="w-full glass-card p-4 rounded-xl flex items-center gap-4 group hover:border-red-500/50 transition-colors duration-300 text-left"
                        >
                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-red-400 border border-red-500/30">
                                <i className="fa-solid fa-right-from-bracket"></i>
                            </div>
                            <div className="hidden lg:block text-left">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sign Out</div>
                                <div className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                                    Logout
                                </div>
                            </div>
                        </button>
                    </>
                ) : isMounted ? (
                    <Link
                        href="/signup"
                        className="w-full glass-card p-4 rounded-xl flex items-center gap-4 group hover:border-marcan-red/50 transition-colors duration-300"
                    >
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-marcan-red border border-marcan-red/30 shadow-neon">
                            <i className="fa-solid fa-user-plus"></i>
                        </div>
                        <div className="hidden lg:block text-left">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Join Marcan</div>
                            <div className="text-sm font-bold text-white group-hover:text-marcan-red transition-colors">
                                Sign Up
                            </div>
                        </div>
                    </Link>
                ) : null}
            </div>
        </aside>
    );
}
