'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useI18n } from '@/contexts/I18nContext';

const INDUSTRY_LOGOS: Record<string, { icon: string; bgClass: string; iconClass: string }> = {
    'Precision Machining': {
        icon: 'fa-microchip',
        bgClass: 'bg-blue-500/10',
        iconClass: 'text-blue-400',
    },
    'Foundries & Casting': {
        icon: 'fa-fire',
        bgClass: 'bg-orange-500/10',
        iconClass: 'text-orange-400',
    },
    'Surface Finishing': {
        icon: 'fa-spray-can-sparkles',
        bgClass: 'bg-purple-500/10',
        iconClass: 'text-purple-400',
    },
    'Tooling & Molds': {
        icon: 'fa-screwdriver-wrench',
        bgClass: 'bg-green-500/10',
        iconClass: 'text-green-400',
    },
    'Automation': {
        icon: 'fa-robot',
        bgClass: 'bg-cyan-500/10',
        iconClass: 'text-cyan-400',
    },
};

interface CompanyProfile {
    id: string;
    profileType?: 'supplier' | 'storefront';
    name: string;
    location: string;
    description: string;
    icon: string;
    tags: string[];
    userId?: string;
    logoUrl?: string;
    website?: string;
    phone?: string;
    email?: string;
    aboutUs?: string;
    capabilities?: string[];
    certifications?: string[];
    industriesServed?: string[];
    capabilitiesByType?: {
        INDUSTRY?: string[];
    };
}

function StoreProfilePageContent() {
    const searchParams = useSearchParams();
    const companyId = searchParams.get('id');
    const { t } = useI18n();
    const [company, setCompany] = useState<CompanyProfile | null>(null);
    const [userData, setUserData] = useState<any>(null);

    useEffect(() => {
        if (!companyId) return;

        const fetchCompany = async () => {
            try {
                const response = await fetch(`/api/profiles?id=${encodeURIComponent(companyId)}`);
                if (!response.ok) throw new Error('Failed to fetch profile');

                const foundCompany = await response.json();
                setCompany(foundCompany);
                setUserData(foundCompany);
            } catch (error) {
                console.error('Error fetching company profile:', error);
                setCompany(null);
            }
        };

        fetchCompany();
    }, [companyId]);

    if (!company) {
        return (
            <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
                <Header breadcrumb="Company Profile" />
                <div className="flex-1 overflow-y-auto p-8 relative">
                    <div className="text-center py-12">
                        <p className="text-slate-400">{t('storefrontProfile.companyNotFound')}</p>
                        <Link href="/shop?tab=stores&restoreStores=1" className="text-marcan-red hover:text-white mt-4 inline-block">
                            {'<-'} {t('storefrontProfile.backToStores')}
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    const displayName = userData?.companyName || company.name;
    const displayLocation = userData ? `${userData.city || ''}, ${userData.province || ''}`.trim() : company.location;
    const displayWebsite = userData?.website || company.website;
    const displayPhone = userData?.phone || company.phone;
    const displayEmail = userData?.email || company.email;
    const displayAboutUs = userData?.aboutUs || company.aboutUs || company.description;
    const displayCapabilities = userData?.capabilities || company.capabilities || [];
    const displayCertifications = userData?.certifications || company.certifications || [];
    const displayIndustries = (
        userData?.industriesServed ||
        userData?.capabilitiesByType?.INDUSTRY ||
        company.industriesServed ||
        company.capabilitiesByType?.INDUSTRY ||
        []
    ).filter(Boolean);
    const displayTags = company.tags || [];
    const displayIcon = userData?.selectedIcon || company.icon || 'fa-industry';
    const displayLogoUrl = userData?.logoUrl || company.logoUrl;
    const displayProfileType = userData?.profileType || company.profileType;
    const isStorefrontProfile = displayProfileType === 'storefront';
    const normalizedWebsiteUrl = displayWebsite
        ? (/^https?:\/\//i.test(displayWebsite) ? displayWebsite : `https://${displayWebsite}`)
        : '';
    const getIndustryLogo = (industries: string[], seed: string) => {
        const valid = Array.isArray(industries) ? industries.filter((i) => INDUSTRY_LOGOS[i]) : [];
        if (valid.length === 0) return null;
        if (valid.length === 1) return INDUSTRY_LOGOS[valid[0]];
        const seedString = `${seed}:${valid.join('|')}`;
        let hash = 0;
        for (let i = 0; i < seedString.length; i += 1) {
            hash = (hash * 31 + seedString.charCodeAt(i)) >>> 0;
        }
        const idx = hash % valid.length;
        return INDUSTRY_LOGOS[valid[idx]];
    };
    const headerIndustryLogo = isStorefrontProfile ? null : getIndustryLogo(displayIndustries, company.id || displayName || '');

    return (
        <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
            <Header breadcrumb="Company Profile" />

            <div className="flex-1 overflow-y-auto p-8 relative">
                <Link
                    href="/shop?tab=stores&restoreStores=1"
                    className="mb-6 flex items-center text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider group"
                >
                    <i className="fa-solid fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i> {t('storefrontProfile.backToStores')}
                </Link>

                <div className="glass-card rounded-3xl p-8 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10">
                        <i className={`fa-solid ${displayIcon} text-9xl text-slate-500`}></i>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-marcan-dark/90 to-transparent z-0"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                        {displayLogoUrl ? (
                            <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center overflow-hidden shadow-neon shrink-0">
                                <img src={displayLogoUrl} alt={displayName} className="w-full h-full object-cover" />
                            </div>
                        ) : headerIndustryLogo ? (
                            <div className={`w-24 h-24 rounded-2xl ${headerIndustryLogo.bgClass} flex items-center justify-center shadow-neon shrink-0`}>
                                <i className={`fa-solid ${headerIndustryLogo.icon} ${headerIndustryLogo.iconClass} text-4xl`}></i>
                            </div>
                        ) : (
                            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-3xl shadow-neon shrink-0 ${isStorefrontProfile ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-white text-marcan-dark'}`}>
                                <i className={`fa-solid ${displayIcon} ${isStorefrontProfile ? 'text-orange-400' : 'text-marcan-red'}`}></i>
                            </div>
                        )}
                        <div className="flex-grow">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="font-heading text-3xl font-bold text-white">{displayName}</h1>
                                <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                                    <i className="fa-solid fa-check-circle"></i> {t('storefrontProfile.verifiedSupplier')}
                                </span>
                            </div>
                            <p className="text-slate-400 text-sm mb-4 flex items-center gap-4 flex-wrap">
                                {displayLocation && (
                                    <span>
                                        <i className="fa-solid fa-location-dot mr-1 text-marcan-red"></i> {displayLocation}
                                    </span>
                                )}
                                {displayWebsite && (
                                    <span>
                                        <i className="fa-solid fa-globe mr-1 text-slate-500"></i>{' '}
                                        <a
                                            href={normalizedWebsiteUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-slate-300 hover:text-marcan-red underline underline-offset-2 transition-colors"
                                        >
                                            {displayWebsite}
                                        </a>
                                    </span>
                                )}
                            </p>
                            {displayTags.length > 0 && (
                                <div className="flex gap-2 flex-wrap">
                                    {displayTags.map((tag) => (
                                        <span key={tag} className="bg-white/5 border border-white/10 px-3 py-1 rounded text-xs text-slate-300">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {displayAboutUs && (
                            <div className="glass-card p-8 rounded-2xl border border-white/5">
                                <h3 className="font-bold text-lg text-white mb-4 uppercase tracking-wide border-b border-white/5 pb-2">
                                    {t('storefrontProfile.aboutUs')}
                                </h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{displayAboutUs}</p>
                            </div>
                        )}

                        {displayCapabilities.length > 0 && (
                            <div className="glass-card p-8 rounded-2xl border border-white/5">
                                <h3 className="font-bold text-lg text-white mb-6 uppercase tracking-wide border-b border-white/5 pb-2">
                                    {t('storefrontProfile.coreCapabilities')}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {displayCapabilities.map((capability: string, index: number) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <i className="fa-solid fa-check-circle text-marcan-red mt-1"></i>
                                            <div>
                                                <h4 className="text-white font-bold text-sm">{capability}</h4>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        {(displayPhone || displayEmail || displayLocation) && (
                            <div className="glass-card p-6 rounded-2xl border border-white/5">
                                <h3 className="font-bold text-white mb-4 uppercase text-xs tracking-widest">{t('storefrontProfile.contactInformation')}</h3>
                                <div className="space-y-4">
                                    {displayPhone && (
                                        <div className="flex items-center gap-3 text-sm text-slate-300">
                                            <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-marcan-red">
                                                <i className="fa-solid fa-phone"></i>
                                            </div>
                                            <span>{displayPhone}</span>
                                        </div>
                                    )}
                                    {displayEmail && (
                                        <div className="flex items-center gap-3 text-sm text-slate-300">
                                            <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-marcan-red">
                                                <i className="fa-solid fa-envelope"></i>
                                            </div>
                                            <span>{displayEmail}</span>
                                        </div>
                                    )}
                                    {displayLocation && (
                                        <div className="flex items-center gap-3 text-sm text-slate-300">
                                            <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-marcan-red">
                                                <i className="fa-solid fa-location-dot"></i>
                                            </div>
                                            <span>{displayLocation}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {displayCertifications.length > 0 && (
                            <div className="glass-card p-6 rounded-2xl border border-white/5">
                                <h3 className="font-bold text-white mb-4 uppercase text-xs tracking-widest">{t('storefrontProfile.certifications')}</h3>
                                <div className="space-y-3">
                                    {displayCertifications.map((cert: string, index: number) => (
                                        <div key={index} className="flex items-center gap-3 p-2 rounded bg-white/5 border border-white/5">
                                            <i className="fa-solid fa-certificate text-yellow-500"></i>
                                            <div>
                                                <div className="text-xs font-bold text-white">{cert}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {displayIndustries.length > 0 && (
                            <div className="glass-card p-6 rounded-2xl border border-white/5">
                                <h3 className="font-bold text-white mb-4 uppercase text-xs tracking-widest">{t('storefrontProfile.industriesServed')}</h3>
                                <div className="flex flex-wrap gap-3">
                                    {displayIndustries.map((industry: string) => {
                                        const map = INDUSTRY_LOGOS[industry];
                                        return (
                                            <div
                                                key={industry}
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10"
                                            >
                                                {map ? (
                                                    <div className={`w-7 h-7 rounded-md ${map.bgClass} flex items-center justify-center`}>
                                                        <i className={`fa-solid ${map.icon} ${map.iconClass} text-sm`}></i>
                                                    </div>
                                                ) : (
                                                    <div className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center text-slate-400">
                                                        <i className="fa-solid fa-industry text-sm"></i>
                                                    </div>
                                                )}
                                                <span className="text-slate-300 text-xs font-semibold">{industry}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function StoreProfilePage() {
    return (
        <Suspense fallback={
            <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
                <Header breadcrumb="Company Profile" />
                <div className="flex-1 overflow-y-auto p-8 relative">
                    <div className="text-center py-12">
                        <p className="text-slate-400">Loading...</p>
                    </div>
                </div>
            </main>
        }>
            <StoreProfilePageContent />
        </Suspense>
    );
}

