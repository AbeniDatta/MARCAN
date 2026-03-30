'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/contexts/I18nContext';
import { useMobileNav } from '@/contexts/MobileNavContext';

interface HeaderProps {
    breadcrumb?: string;
}

export default function Header({ breadcrumb = 'Overview' }: HeaderProps) {
    const { isAuthenticated, user, isMounted } = useAuth();
    const { lang, setLang, t, translateText } = useI18n();
    const { open } = useMobileNav();

    return (
        <header className="min-h-16 sm:h-20 shrink-0 px-3 sm:px-5 lg:px-8 py-2 sm:py-0 flex flex-wrap gap-y-2 justify-between items-center border-b border-white/5 bg-marcan-dark/30 backdrop-blur-sm z-30">
            {/* Left: Context */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <button
                    type="button"
                    onClick={open}
                    className="lg:hidden shrink-0 w-10 h-10 rounded-lg border border-white/10 bg-white/5 text-slate-200 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
                    aria-label={t('header.openMenuAria')}
                >
                    <i className="fa-solid fa-bars text-lg" aria-hidden />
                </button>
                <Link
                    href="/"
                    className="font-heading font-bold text-white text-base sm:text-lg tracking-tight hover:text-marcan-red transition-colors cursor-pointer truncate shrink min-w-0"
                >
                    {t('header.brand')}
                </Link>
                <span className="text-slate-600 text-lg shrink-0 hidden sm:inline" aria-hidden>
                    /
                </span>
                <span className="text-slate-400 text-xs sm:text-sm font-medium truncate min-w-0 max-w-[40vw] sm:max-w-[min(24rem,50vw)]">
                    {translateText(breadcrumb)}
                </span>
            </div>

            {/* Right: Relevance & Actions */}
            <div className="flex items-center gap-2 sm:gap-4 md:gap-6 shrink-0 ml-auto">
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
                        <>
                            <Link
                                href="/my-account"
                                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider transition-all hover:border-marcan-red/50"
                            >
                                {t('header.myAccount')}
                            </Link>
                            <div className="h-4 w-[1px] bg-white/10"></div>
                            <div
                                className="w-9 h-9 rounded-lg bg-gradient-to-br from-marcan-red to-red-900 flex items-center justify-center text-white text-xs font-bold shadow-neon border border-white/10"
                                title={`${user.firstName} ${user.lastName || ''}`.trim()}
                            >
                                {user.firstName.charAt(0).toUpperCase()}
                                {user.lastName?.charAt(0).toUpperCase() || ''}
                            </div>
                        </>
                    ) : isMounted ? (
                        <Link
                            href="/login"
                            className="px-5 py-2 rounded-lg bg-white/10 hover:bg-marcan-red border border-white/10 flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-neon transition-all"
                        >
                            {t('header.login')}
                        </Link>
                    ) : (
                        <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/10"></div>
                    )}
                </div>
            </div>
        </header>
    );
}
