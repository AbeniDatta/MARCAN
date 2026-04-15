'use client';

import { useState, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import SourcingRequestModal from '@/components/SourcingRequestModal';
import { normalizeIndustryHubName } from '@/lib/industryHubNormalize';

function mergeUniqueStrings(...lists: (string[] | undefined)[]): string[] {
    const s = new Set<string>();
    for (const list of lists) {
        if (!Array.isArray(list)) continue;
        for (const x of list) {
            const v = String(x || '').trim();
            if (v) s.add(v);
        }
    }
    return Array.from(s);
}

const TYPICAL_JOB_LABELS: Record<string, string> = {
    PROTOTYPE: 'Prototype',
    LOW_VOLUME: 'Low volume',
    MEDIUM_VOLUME: 'Medium volume',
    HIGH_VOLUME: 'High volume',
};

function formatLeadTimeRange(
    minDays: number | null | undefined,
    maxDays: number | null | undefined,
): string | null {
    if (minDays != null && maxDays != null) return `${minDays}–${maxDays} days`;
    if (minDays != null) return `${minDays}+ days`;
    if (maxDays != null) return `Up to ${maxDays} days`;
    return null;
}

function formatMaxPartMm(
    x: number | null | undefined,
    y: number | null | undefined,
    z: number | null | undefined,
): string | null {
    if (x == null && y == null && z == null) return null;
    return [x, y, z].map((v) => (v == null ? '—' : String(v))).join(' × ');
}

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
    preferredContactMethod?: 'EMAIL' | 'PHONE' | 'PLATFORM_ONLY' | null;
    aboutUs?: string;
    capabilities?: string[];
    certifications?: string[];
    industriesServed?: string[];
    industries?: string[];
    capabilitiesByType?: {
        PROCESS?: string[];
        MATERIAL?: string[];
        FINISH?: string[];
        INDUSTRY?: string[];
    };
    businessNumber?: string;
    materials?: string[];
    finishes?: string[];
    typicalJobSize?: string | null;
    leadTimeMinDays?: number | null;
    leadTimeMaxDays?: number | null;
    maxPartSizeMmX?: number | null;
    maxPartSizeMmY?: number | null;
    maxPartSizeMmZ?: number | null;
}

function ProfilePageContent() {
    const searchParams = useSearchParams();
    const companyId = searchParams.get('id');
    const returnTo = searchParams.get('from') || '/directory';
    const isReturnToStores = returnTo.startsWith('/shop?tab=stores');
    const [company, setCompany] = useState<CompanyProfile | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [companyListings, setCompanyListings] = useState<any[]>([]);
    const [companyRequests, setCompanyRequests] = useState<any[]>([]);
    const [selectedListing, setSelectedListing] = useState<any | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
    const [isDomReady, setIsDomReady] = useState(false);

    useEffect(() => {
        setIsDomReady(true);
    }, []);

    useEffect(() => {
        if (!selectedListing && !selectedRequest) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setSelectedListing(null);
                setSelectedRequest(null);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [selectedListing, selectedRequest]);

    useEffect(() => {
        if (!companyId) return;

        // Fetch company from API
        const fetchCompany = async () => {
            try {
                // Fetch a single profile by id so storefront profiles can be viewed even if excluded from the Network Directory.
                const response = await fetch(`/api/profiles?id=${encodeURIComponent(companyId)}`);
                if (!response.ok) throw new Error('Failed to fetch profile');

                const foundCompany = await response.json();
                setCompany(foundCompany);
                setUserData(foundCompany);

                const companyNames = [foundCompany?.companyName, foundCompany?.name]
                    .map((name) => String(name || '').trim().toLowerCase())
                    .filter(Boolean);

                try {
                    const [listingsRes, requestsRes] = await Promise.all([
                        fetch('/api/listings'),
                        fetch('/api/wishlist'),
                    ]);

                    const listingsData = listingsRes.ok ? await listingsRes.json() : [];
                    const requestsData = requestsRes.ok ? await requestsRes.json() : [];

                    const relatedListings = (Array.isArray(listingsData) ? listingsData : []).filter((listing: any) => {
                        const supplierName = String(listing?.supplier || '').trim().toLowerCase();
                        return (
                            listing?.profileId === foundCompany?.id ||
                            listing?.storefrontProfileId === foundCompany?.id ||
                            companyNames.includes(supplierName)
                        );
                    });

                    const relatedRequests = (Array.isArray(requestsData) ? requestsData : []).filter((request: any) => {
                        const requestCompany = String(request?.company || request?.companyName || '').trim().toLowerCase();
                        return companyNames.includes(requestCompany);
                    });

                    setCompanyListings(relatedListings);
                    setCompanyRequests(relatedRequests);
                } catch (error) {
                    console.error('Error fetching company activity:', error);
                    setCompanyListings([]);
                    setCompanyRequests([]);
                }
            } catch (error) {
                console.error('Error fetching company profile:', error);
                setCompany(null);
                setCompanyListings([]);
                setCompanyRequests([]);
            }
        };

        fetchCompany();
    }, [companyId]);

    if (!company) {
        return (
            <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
                <Header breadcrumb="Company Profile" />
                <div className="flex-1 overflow-y-auto page-scroll relative">
                    <div className="text-center py-12">
                        <p className="text-slate-400">Company not found.</p>
                        <Link href={returnTo} className="text-marcan-red hover:text-white mt-4 inline-block">
                            Back to Directory
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    // Get initials from company name
    const getInitials = (name: string) => {
        const words = name.split(' ');
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Use user data if available, otherwise use company data
    const displayName = userData?.companyName || company.name;
    const displayLocation = userData ? `${userData.city || ''}, ${userData.province || ''}`.trim() : company.location;
    const displayWebsite = userData?.website || company.website;
    const displayPhone = userData?.phone || company.phone;
    const displayEmail = userData?.email || company.email;
    const preferredContactMethodRaw = userData?.preferredContactMethod ?? company.preferredContactMethod ?? null;
    const displayPreferredContactMethod =
        preferredContactMethodRaw === 'PHONE'
            ? 'Phone'
            : preferredContactMethodRaw === 'EMAIL'
                ? 'Email'
                : null;
    const displayAboutUs = userData?.aboutUs || company.aboutUs || company.description;
    const displayCapabilities = userData?.capabilities || company.capabilities || [];
    const displayCertifications = userData?.certifications || company.certifications || [];
    const capabilitiesByType = userData?.capabilitiesByType || company.capabilitiesByType;
    /** Marcan capability hubs (DB `capabilities` / API `industriesServed`) */
    const displayMarcanCapabilities = mergeUniqueStrings(
        userData?.industriesServed,
        company.industriesServed,
    );
    /** Taxonomy / free-text industries (not the hub list) */
    const displayIndustriesTaxonomy = mergeUniqueStrings(
        capabilitiesByType?.INDUSTRY,
        userData?.industries,
        company.industries,
    );

    const displayPrimaryProcesses =
        capabilitiesByType?.PROCESS && capabilitiesByType.PROCESS.length > 0
            ? capabilitiesByType.PROCESS
            : displayCapabilities;

    const displayMaterialsList = mergeUniqueStrings(
        capabilitiesByType?.MATERIAL,
        userData?.materials,
        company.materials,
    );

    const displayFinishesList = mergeUniqueStrings(
        capabilitiesByType?.FINISH,
        userData?.finishes,
        company.finishes,
    );

    const typicalJobSizeRaw = userData?.typicalJobSize ?? company.typicalJobSize;
    const typicalJobSizeLabel =
        typicalJobSizeRaw != null && String(typicalJobSizeRaw).length > 0
            ? TYPICAL_JOB_LABELS[String(typicalJobSizeRaw)] || String(typicalJobSizeRaw)
            : null;

    const leadTimeLabel = formatLeadTimeRange(
        userData?.leadTimeMinDays ?? company.leadTimeMinDays,
        userData?.leadTimeMaxDays ?? company.leadTimeMaxDays,
    );

    const maxPartLabel = formatMaxPartMm(
        userData?.maxPartSizeMmX ?? company.maxPartSizeMmX,
        userData?.maxPartSizeMmY ?? company.maxPartSizeMmY,
        userData?.maxPartSizeMmZ ?? company.maxPartSizeMmZ,
    );

    const hasProductionProfileSection =
        displayPrimaryProcesses.length > 0 ||
        displayMaterialsList.length > 0 ||
        displayFinishesList.length > 0 ||
        typicalJobSizeLabel != null ||
        leadTimeLabel != null ||
        maxPartLabel != null;

    const headerCapabilityHubs = displayMarcanCapabilities;
    const displayIcon = userData?.selectedIcon || company.icon || 'fa-industry';
    const displayLogoUrl = userData?.logoUrl || company.logoUrl;
    const displayProfileType = userData?.profileType || company.profileType;
    const isStorefrontProfile = displayProfileType === 'storefront';
    const normalizedWebsiteUrl = displayWebsite
        ? (/^https?:\/\//i.test(displayWebsite) ? displayWebsite : `https://${displayWebsite}`)
        : '';
    const getIndustryLogo = (industries: string[], seed: string) => {
        const normalized = Array.isArray(industries) ? industries.map((i) => normalizeIndustryHubName(i)).filter(Boolean) as string[] : [];
        const valid = normalized.filter((i) => INDUSTRY_LOGOS[i]);
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
    const headerIndustryLogo = isStorefrontProfile ? null : getIndustryLogo(displayMarcanCapabilities, company.id || displayName || '');

    const closeModals = () => {
        setSelectedListing(null);
        setSelectedRequest(null);
    };

    const detailsModal = isDomReady && selectedListing
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                <button
                    type="button"
                    className="absolute inset-0 bg-marcan-dark/90 backdrop-blur-sm"
                    onClick={closeModals}
                    aria-label="Close details modal"
                />
                <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-card rounded-3xl border border-white/10 shadow-2xl flex flex-col">
                    <div className="sticky top-0 z-20 flex justify-between items-center p-6 border-b border-white/10 bg-marcan-dark/95 backdrop-blur-md">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded text-[10px] font-bold uppercase shrink-0">
                                {selectedListing.listingType || 'Listing'}
                            </span>
                            <h3 className="font-heading font-bold text-xl md:text-2xl text-white truncate">
                                {selectedListing.title || 'Details'}
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={closeModals}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all border border-white/5"
                            aria-label="Close details modal"
                        >
                            <i className="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>
                    <div className="p-6 md:p-8 space-y-8 relative z-10">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <i className="fa-solid fa-align-left text-orange-400"></i> Description
                                        </h4>
                                        <div className="glass-card p-6 rounded-2xl border border-white/5 text-sm text-slate-300 leading-relaxed">
                                            <p>{selectedListing.description || 'No description provided.'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <i className="fa-solid fa-list-check text-orange-400"></i> Listing Details
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col">
                                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Type</span>
                                                <span className="text-sm font-semibold text-white">{selectedListing.listingType || 'Not specified'}</span>
                                            </div>
                                            <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col">
                                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Price</span>
                                                <span className="text-sm font-semibold text-white">{selectedListing.price || 'Negotiable'}</span>
                                            </div>
                                            <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col">
                                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Location</span>
                                                <span className="text-sm font-semibold text-white">{selectedListing.location || 'Not specified'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="glass-card p-6 rounded-2xl border border-orange-500/20 bg-gradient-to-b from-orange-500/5 to-transparent shadow-[0_0_30px_rgba(249,115,22,0.05)]">
                                        <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-2">Asking Price</div>
                                        <div className="text-4xl font-black text-white tracking-tight mb-6">
                                            {selectedListing.price || 'Negotiable'}
                                        </div>
                                        {displayEmail ? (
                                            <a
                                                href={`mailto:${displayEmail}?subject=${encodeURIComponent(`Industrial storefront inquiry: ${selectedListing.title || 'Listing'}`)}`}
                                                className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                                            >
                                                <i className="fa-solid fa-envelope"></i> Email Supplier
                                            </a>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled
                                                className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-slate-500 text-sm font-bold uppercase tracking-wider cursor-not-allowed"
                                            >
                                                Email Supplier
                                            </button>
                                        )}
                                    </div>
                                    <div className="glass-card p-6 rounded-2xl border border-white/5">
                                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Listed By</h4>
                                        <div className="flex items-center gap-4 mb-5">
                                            {displayLogoUrl ? (
                                                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10 shadow-inner">
                                                    <img src={displayLogoUrl} alt={displayName} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-orange-400 border border-white/10 shadow-inner">
                                                    <i className={`fa-solid ${displayIcon || 'fa-industry'} text-xl`}></i>
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-sm font-bold text-white mb-1">{displayName}</div>
                                                <div className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase border border-blue-500/20">
                                                    <i className="fa-solid fa-circle-check"></i> Platform Member
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={closeModals}
                                            className="w-full py-2.5 rounded-lg border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-white/5 hover:text-white transition-all"
                                        >
                                            Back to Profile
                                        </button>
                                    </div>
                                </div>
                            </div>
                    </div>
                </div>
            </div>,
            document.body
        )
        : null;

    return (
        <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
            <Header breadcrumb="Company Profile" />

            <div className="flex-1 overflow-y-auto page-scroll relative">
                <Link
                    href={returnTo}
                    className="mb-6 flex items-center text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider group"
                >
                    <i className="fa-solid fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i> {isReturnToStores ? 'Back to Stores' : 'Back to Directory'}
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
                                    <i className="fa-solid fa-check-circle"></i> Verified Supplier
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
                            {headerCapabilityHubs.length > 0 && (
                                <div className="flex gap-2 flex-wrap">
                                    {headerCapabilityHubs.map((cap: string, idx: number) => {
                                        const label = normalizeIndustryHubName(cap) || cap;
                                        return (
                                            <span key={`${label}-${idx}`} className="bg-white/5 border border-white/10 px-3 py-1 rounded text-xs text-slate-300">
                                                {label}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* About Us */}
                        {displayAboutUs && (
                            <div className="glass-card p-8 rounded-2xl border border-white/5">
                                <h3 className="font-bold text-lg text-white mb-4 uppercase tracking-wide border-b border-white/5 pb-2">
                                    About Us
                                </h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{displayAboutUs}</p>
                            </div>
                        )}

                        {/* Primary processes, materials, finishes, production metrics */}
                        {hasProductionProfileSection && (
                            <div className="glass-card p-8 rounded-2xl border border-white/5 space-y-8">
                                {displayPrimaryProcesses.length > 0 && (
                                    <div>
                                        <h3 className="font-bold text-lg text-white mb-4 uppercase tracking-wide border-b border-white/5 pb-2">
                                            Primary Processes
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {displayPrimaryProcesses.map((proc: string, index: number) => (
                                                <div key={`${proc}-${index}`} className="flex items-start gap-3">
                                                    <i className="fa-solid fa-check-circle text-marcan-red mt-1"></i>
                                                    <div>
                                                        <h4 className="text-white font-bold text-sm">{proc}</h4>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {displayMaterialsList.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-sm mb-3 uppercase tracking-wide text-slate-400">
                                            Materials
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {displayMaterialsList.map((m) => (
                                                <span
                                                    key={m}
                                                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs"
                                                >
                                                    {m}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {displayFinishesList.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-sm mb-3 uppercase tracking-wide text-slate-400">
                                            Finishes
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {displayFinishesList.map((f) => (
                                                <span
                                                    key={f}
                                                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs"
                                                >
                                                    {f}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(typicalJobSizeLabel || leadTimeLabel || maxPartLabel) && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                                        {typicalJobSizeLabel && (
                                            <div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                                                    Typical job size
                                                </div>
                                                <div className="text-sm text-slate-300">{typicalJobSizeLabel}</div>
                                            </div>
                                        )}
                                        {leadTimeLabel && (
                                            <div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                                                    Typical lead time
                                                </div>
                                                <div className="text-sm text-slate-300">{leadTimeLabel}</div>
                                            </div>
                                        )}
                                        {maxPartLabel && (
                                            <div className="sm:col-span-2">
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                                                    Max part size (mm)
                                                </div>
                                                <div className="text-sm text-slate-300 font-mono">{maxPartLabel}</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Contact Information */}
                        {(displayPhone || displayEmail || displayLocation || displayPreferredContactMethod) && (
                            <div className="glass-card p-6 rounded-2xl border border-white/5">
                                <h3 className="font-bold text-white mb-4 uppercase text-xs tracking-widest">Contact Information</h3>
                                <div className="space-y-4">
                                    {displayPreferredContactMethod && (
                                        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-blue-300">
                                                Preferred Contact Method
                                            </div>
                                            <div className="mt-1 text-sm font-semibold text-white">{displayPreferredContactMethod}</div>
                                        </div>
                                    )}
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

                        {/* Industries served — taxonomy / additional industries */}
                        {displayIndustriesTaxonomy.length > 0 && (
                            <div className="glass-card p-6 rounded-2xl border border-white/5">
                                <h3 className="font-bold text-white mb-4 uppercase text-xs tracking-widest">Industries served</h3>
                                <div className="flex flex-wrap gap-3">
                                    {displayIndustriesTaxonomy.map((industry: string) => {
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

                        {/* Certifications */}
                        {displayCertifications.length > 0 && (
                            <div className="glass-card p-6 rounded-2xl border border-white/5">
                                <h3 className="font-bold text-white mb-4 uppercase text-xs tracking-widest">Certifications</h3>
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
                    </div>
                </div>

                <div className="mt-10 space-y-8">
                    <div>
                        <h3 className="font-bold text-lg text-white mb-4 uppercase tracking-wide border-b border-white/10 pb-2">
                            Storefront Listings
                        </h3>
                        {companyListings.length === 0 ? (
                            <p className="text-slate-400 text-sm">No storefront listings found for this company.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {companyListings.map((listing) => (
                                    <div key={listing.id} className="glass-card p-4 rounded-xl border border-white/5 relative overflow-hidden group">
                                        <div className="text-[10px] text-orange-400 uppercase font-bold tracking-wider mb-2">
                                            {listing.listingType || 'Listing'}
                                        </div>
                                        <h4 className="text-sm font-bold text-white line-clamp-1 mb-2">{listing.title || 'Untitled listing'}</h4>
                                        <p className="text-xs text-slate-400 line-clamp-2 mb-3">{listing.description || 'No description provided.'}</p>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-sm font-black text-white">{listing.price || 'Negotiable'}</span>
                                            <span className="text-[11px] text-slate-400 truncate">{listing.location || 'N/A'}</span>
                                        </div>
                                        <div className="absolute inset-0 bg-marcan-dark/85 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedRequest(null);
                                                    setSelectedListing(listing);
                                                }}
                                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-bold uppercase tracking-wider"
                                            >
                                                View Listing
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="font-bold text-lg text-white mb-4 uppercase tracking-wide border-b border-white/10 pb-2">
                            Sourcing Requests
                        </h3>
                        {companyRequests.length === 0 ? (
                            <p className="text-slate-400 text-sm">No sourcing requests found for this company.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {companyRequests.map((request) => (
                                    <div key={request.id} className="glass-card p-4 rounded-xl border border-white/5 relative overflow-hidden group">
                                        <div className="text-[10px] text-orange-400 uppercase font-bold tracking-wider mb-2">
                                            {request.category || 'Request'}
                                        </div>
                                        <h4 className="text-sm font-bold text-white line-clamp-1 mb-2">{request.title || 'Untitled request'}</h4>
                                        <p className="text-xs text-slate-400 line-clamp-2 mb-3">{request.description || 'No description provided.'}</p>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-sm font-black text-white">{request.targetPrice || 'Not specified'}</span>
                                            <span className="text-[11px] text-slate-400 truncate">{request.location || 'N/A'}</span>
                                        </div>
                                        <div className="absolute inset-0 bg-marcan-dark/85 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedListing(null);
                                                    setSelectedRequest(request);
                                                }}
                                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-bold uppercase tracking-wider"
                                            >
                                                View Request
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {detailsModal}
            <SourcingRequestModal
                open={!!selectedRequest && isDomReady}
                request={selectedRequest}
                onClose={() => setSelectedRequest(null)}
            />
        </main>
    );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={
            <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
                <Header breadcrumb="Company Profile" />
                <div className="flex-1 overflow-y-auto page-scroll relative">
                    <div className="text-center py-12">
                        <p className="text-slate-400">Loading...</p>
                    </div>
                </div>
            </main>
        }>
            <ProfilePageContent />
        </Suspense>
    );
}
