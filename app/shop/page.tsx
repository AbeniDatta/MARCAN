'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';

type ShopListingCard = {
    // listing identifiers
    listingId: string;
    profileId: string;
    createdAt?: string;
    timestamp?: number;

    // company / supplier profile display (enriched from /api/profiles)
    supplierName: string;
    supplierIcon: string;
    supplierLogoUrl?: string | null;
    supplierTags: string[];
    supplierEmail?: string | null;

    // fields entered on create listing
    title: string;
    listingType: string;
    price: string;
    location: string;
    description: string;

    // derived badge/icon info from /api/listings
    badge?: string;
    badgeColor?: string;
    icon?: string | null;
};

type StoreCard = {
    id: string;
    profileType?: 'supplier' | 'storefront';
    name: string;
    location: string;
    description: string;
    icon: string;
    logoUrl?: string | null;
    tags: string[];
    industriesServed?: string[];
    province?: string;
    certifications?: Array<string | { code?: string; name?: string }>;
    email?: string | null;
};

const INDUSTRY_HUBS = ['Precision Machining', 'Foundries & Casting', 'Surface Finishing', 'Tooling & Molds', 'Automation'];
const INDUSTRY_LOGOS: Record<string, { icon: string; bgClass: string; iconClass: string }> = {
    'Precision Machining': { icon: 'fa-microchip', bgClass: 'bg-blue-500/10', iconClass: 'text-blue-400' },
    'Foundries & Casting': { icon: 'fa-fire', bgClass: 'bg-orange-500/10', iconClass: 'text-orange-400' },
    'Surface Finishing': { icon: 'fa-spray-can-sparkles', bgClass: 'bg-purple-500/10', iconClass: 'text-purple-400' },
    'Tooling & Molds': { icon: 'fa-screwdriver-wrench', bgClass: 'bg-green-500/10', iconClass: 'text-green-400' },
    Automation: { icon: 'fa-robot', bgClass: 'bg-cyan-500/10', iconClass: 'text-cyan-400' },
};

const CANADIAN_PROVINCES = [
    { code: 'ON', name: 'Ontario' },
    { code: 'QC', name: 'Quebec' },
    { code: 'BC', name: 'British Columbia' },
    { code: 'AB', name: 'Alberta' },
    { code: 'MB', name: 'Manitoba' },
    { code: 'SK', name: 'Saskatchewan' },
    { code: 'NS', name: 'Nova Scotia' },
    { code: 'NB', name: 'New Brunswick' },
    { code: 'NL', name: 'Newfoundland and Labrador' },
    { code: 'PE', name: 'Prince Edward Island' },
    { code: 'NT', name: 'Northwest Territories' },
    { code: 'YT', name: 'Yukon' },
    { code: 'NU', name: 'Nunavut' },
];
const PROVINCE_NAME_BY_CODE = new Map(CANADIAN_PROVINCES.map((p) => [p.code, p.name.toLowerCase()]));

const CERTIFICATIONS = [
    { code: 'ISO 9001', label: 'ISO 9001' },
    { code: 'AS9100', label: 'AS9100' },
    { code: 'CGRP', label: 'CGRP' },
    { code: 'NADCAP', label: 'NADCAP' },
    { code: 'ISO 14001', label: 'ISO 14001' },
    { code: 'ISO 45001', label: 'ISO 45001' },
    { code: 'IATF 16949', label: 'IATF 16949' },
    { code: 'ISO 13485', label: 'ISO 13485' },
];

export default function ShopPage() {
    const { isAuthenticated, user, isMounted } = useAuth();
    // Backward compatibility: existing accounts may still have legacy "seller" role.
    const hasSupplierRole = user?.role === 'supplier' || user?.role === 'seller';

    const [isShopOwner, setIsShopOwner] = useState(false);
    const [shops, setShops] = useState<ShopListingCard[]>([]);
    const [activeTab, setActiveTab] = useState<'listings' | 'stores'>('listings');
    const [stores, setStores] = useState<StoreCard[]>([]);
    const [selectedListing, setSelectedListing] = useState<ShopListingCard | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedProvince, setSelectedProvince] = useState<string>('');
    const [listingSort, setListingSort] = useState<'new-to-old' | 'old-to-new' | 'price-high-low' | 'price-low-high'>('new-to-old');
    const [storeFilters, setStoreFilters] = useState({
        search: '',
        industry: '',
        province: '',
        certification: '',
    });
    const [isDomReady, setIsDomReady] = useState(false);
    const isSupplierOrStorefront = !!(isAuthenticated && (isShopOwner || hasSupplierRole));

    const listingCategories = useMemo(() => {
        const unique = Array.from(
            new Set(
                shops
                    .map((shop) => (shop.listingType || '').trim())
                    .filter((type) => type.length > 0)
            )
        );
        return unique.sort((a, b) => a.localeCompare(b));
    }, [shops]);

    const filteredShops = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();
        const extractProvince = (loc: string | undefined | null) => {
            if (!loc) return '';
            const match = String(loc).match(/([A-Za-z]{2})\s*$/);
            return match ? match[1].toUpperCase() : '';
        };

        const filtered = shops.filter((shop) => {
            const categoryMatches = !selectedCategory || shop.listingType === selectedCategory;
            const provinceCode = extractProvince(shop.location);
            const locationMatches =
                !selectedProvince || (provinceCode && provinceCode === selectedProvince);

            if (!normalizedSearch) return categoryMatches && locationMatches;

            const searchableText = [
                shop.title,
                shop.description,
                shop.supplierName,
                shop.location,
                shop.listingType,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return categoryMatches && locationMatches && searchableText.includes(normalizedSearch);
        });

        // Apply sorting similar to sourcing requests
        const sorted = [...filtered];
        switch (listingSort) {
            case 'new-to-old':
                sorted.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                break;
            case 'old-to-new':
                sorted.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                break;
            case 'price-high-low':
                sorted.sort((a, b) => {
                    const priceA = parseFloat(String(a.price || '0').replace(/[^0-9.]/g, '')) || 0;
                    const priceB = parseFloat(String(b.price || '0').replace(/[^0-9.]/g, '')) || 0;
                    return priceB - priceA;
                });
                break;
            case 'price-low-high':
                sorted.sort((a, b) => {
                    const priceA = parseFloat(String(a.price || '0').replace(/[^0-9.]/g, '')) || 0;
                    const priceB = parseFloat(String(b.price || '0').replace(/[^0-9.]/g, '')) || 0;
                    return priceA - priceB;
                });
                break;
        }

        return sorted;
    }, [shops, searchQuery, selectedCategory, selectedProvince, listingSort]);

    const filteredStores = useMemo(() => {
        return stores.filter((store) => {
            if (storeFilters.search.trim()) {
                const normalizedSearch = storeFilters.search.trim().toLowerCase();
                const searchableText = [
                    store.name,
                    store.description,
                    store.location,
                    ...(Array.isArray(store.tags) ? store.tags : []),
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                if (!searchableText.includes(normalizedSearch)) return false;
            }

            if (storeFilters.industry) {
                const storeIndustries = Array.isArray(store.industriesServed) && store.industriesServed.length > 0
                    ? store.industriesServed
                    : (Array.isArray(store.tags) ? store.tags : []);
                const hasIndustry = storeIndustries.some(
                    (hub) => String(hub).toLowerCase() === storeFilters.industry.toLowerCase()
                );
                if (!hasIndustry) return false;
            }

            if (storeFilters.province) {
                const storeProvinceRaw = String(store.province || '').trim();
                const provinceFromField = storeProvinceRaw.toUpperCase();
                const provinceFromLocation = String(store.location || '')
                    .split(',')
                    .pop()
                    ?.trim()
                    .toUpperCase() || '';
                const targetCode = storeFilters.province.toUpperCase();
                const targetName = PROVINCE_NAME_BY_CODE.get(targetCode) || '';

                const storeProvinceName = storeProvinceRaw.toLowerCase();
                const locationProvinceName = String(store.location || '').toLowerCase();

                const isMatch =
                    provinceFromField === targetCode ||
                    provinceFromLocation === targetCode ||
                    storeProvinceName === targetName ||
                    locationProvinceName.includes(targetName);

                if (!isMatch) return false;
            }

            if (storeFilters.certification) {
                const storeCerts = store.certifications || [];
                const certMatches = Array.isArray(storeCerts)
                    ? storeCerts.some((cert) => {
                        if (typeof cert === 'string') {
                            return cert.toLowerCase() === storeFilters.certification.toLowerCase();
                        }
                        return (
                            String(cert.code || '').toLowerCase() === storeFilters.certification.toLowerCase() ||
                            String(cert.name || '').toLowerCase() === storeFilters.certification.toLowerCase()
                        );
                    })
                    : false;
                if (!certMatches) return false;
            }

            return true;
        });
    }, [stores, storeFilters]);

    const getIndustryLogoForStore = (store: StoreCard) => {
        const selectedIndustries = Array.isArray(store.industriesServed)
            ? store.industriesServed.filter((industry) => INDUSTRY_LOGOS[industry])
            : [];

        if (selectedIndustries.length === 0) return null;
        if (selectedIndustries.length === 1) return INDUSTRY_LOGOS[selectedIndustries[0]];

        const seedString = `${store.id || store.name || ''}:${selectedIndustries.join('|')}`;
        let hash = 0;
        for (let i = 0; i < seedString.length; i += 1) {
            hash = (hash * 31 + seedString.charCodeAt(i)) >>> 0;
        }
        const selectedIndex = hash % selectedIndustries.length;
        return INDUSTRY_LOGOS[selectedIndustries[selectedIndex]];
    };

    useEffect(() => {
        setIsDomReady(true);
    }, []);

    useEffect(() => {
        if (!selectedListing) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setSelectedListing(null);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [selectedListing]);

    useEffect(() => {
        const runChecks = async () => {
            if (!isMounted) return;

            if (!isAuthenticated || !user?.email) {
                setIsShopOwner(false);
                return;
            }

            try {
                const res = await fetch(`/api/profiles?userId=${encodeURIComponent(user.email)}`);
                if (!res.ok) {
                    setIsShopOwner(hasSupplierRole);
                    return;
                }

                const profile = await res.json();
                // If a supplier profile exists, allow direct listing creation.
                const hasSupplierProfile = !!profile?.id;
                setIsShopOwner(hasSupplierProfile);
            } catch {
                setIsShopOwner(hasSupplierRole);
            }
        };

        runChecks();
    }, [isMounted, isAuthenticated, user?.email, hasSupplierRole]);

    useEffect(() => {
        // "Our Shop" should be a collection of shop postings (similar to supplier listings),
        // not a collection of all profiles. We approximate this by showing only profiles
        // whose profile id appears in active supplier listings.
        const fetchPostedShops = async () => {
            try {
                const listingsRes = await fetch('/api/listings');
                if (!listingsRes.ok) throw new Error('Failed to fetch listings');
                const listingsData = await listingsRes.json();

                const listings = Array.isArray(listingsData) ? listingsData : [];
                const profileIds = new Set(
                    listings
                        .flatMap((l: any) => [l?.profileId, l?.storefrontProfileId])
                        .filter(Boolean)
                );
                const profileIdList = Array.from(profileIds);

                // Fetch each referenced profile by id (directory filtering may exclude storefront profiles).
                const profileResponses = await Promise.all(
                    profileIdList.map(async (id) => {
                        try {
                            const res = await fetch(`/api/profiles?id=${encodeURIComponent(id)}`);
                            if (!res.ok) return null;
                            return res.json();
                        } catch {
                            return null;
                        }
                    })
                );

                const profiles = profileResponses.filter(Boolean) as any[];

                const profileById = new Map<string, any>(profiles.map((p) => [p.id, p]));

                // Build one card per listing (so title/price/location/description come from the listing form).
                const cards: ShopListingCard[] = listings
                    .map((l: any) => {
                        const supplierProfile = l?.profileId ? profileById.get(l.profileId) : null;
                        const storefrontProfile = l?.storefrontProfileId ? profileById.get(l.storefrontProfileId) : null;
                        if (!supplierProfile && !storefrontProfile) return null;

                        // Merge data: prefer storefront visuals; enrich with supplier tags/email if present
                        const displayProfile = storefrontProfile || supplierProfile;
                        const mergedName = l?.supplier || displayProfile?.name || supplierProfile?.name || storefrontProfile?.name || 'Unknown';
                        const mergedIcon = (storefrontProfile?.icon || supplierProfile?.icon || 'fa-industry');
                        const mergedLogo = storefrontProfile?.logoUrl ?? supplierProfile?.logoUrl ?? null;
                        const mergedTags = Array.isArray(supplierProfile?.tags) ? supplierProfile.tags : (Array.isArray(displayProfile?.tags) ? displayProfile.tags : []);
                        const mergedEmail = supplierProfile?.email ?? storefrontProfile?.email ?? null;
                        const linkProfileId = supplierProfile?.id || storefrontProfile?.id;

                        return {
                            listingId: l?.id,
                            profileId: linkProfileId,
                            createdAt: l?.createdAt,
                            timestamp: l?.timestamp,

                            supplierName: mergedName,
                            supplierIcon: mergedIcon,
                            supplierLogoUrl: mergedLogo,
                            supplierTags: mergedTags,
                            supplierEmail: mergedEmail,

                            title: l?.title || '',
                            listingType: l?.listingType || '',
                            price: l?.price || '',
                            location: l?.location || '',
                            description: l?.description || '',

                            badge: l?.badge,
                            badgeColor: l?.badgeColor,
                            icon: l?.icon,
                        } as ShopListingCard;
                    })
                    .filter(Boolean) as ShopListingCard[];

                setShops(cards);
            } catch (err) {
                console.error('Error fetching posted shops:', err);
                setShops([]);
            }
        };

        fetchPostedShops();
    }, []);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const res = await fetch('/api/profiles?includeStorefront=true');
                if (!res.ok) throw new Error('Failed to fetch stores');
                const data = await res.json();
                setStores(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Error fetching stores:', err);
                setStores([]);
            }
        };

        fetchStores();
    }, []);

    const listingModal = selectedListing && isDomReady
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                <button
                    type="button"
                    className="absolute inset-0 bg-marcan-dark/90 backdrop-blur-sm"
                    onClick={() => setSelectedListing(null)}
                    aria-label="Close listing modal"
                />

                <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-card rounded-3xl border border-white/10 shadow-2xl flex flex-col">
                    <div className="sticky top-0 z-20 flex justify-between items-center p-6 border-b border-white/10 bg-marcan-dark/95 backdrop-blur-md">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded text-[10px] font-bold uppercase shrink-0">
                                {selectedListing.listingType || 'Listing'}
                            </span>
                            <h3 className="font-heading font-bold text-xl md:text-2xl text-white truncate">
                                {selectedListing.title || 'Untitled listing'}
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedListing(null)}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all border border-white/5"
                            aria-label="Close listing modal"
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
                                        <p>
                                            {selectedListing.description || 'No description available for this listing.'}
                                        </p>
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

                                    {selectedListing.supplierEmail ? (
                                        <a
                                            href={`mailto:${selectedListing.supplierEmail}?subject=${encodeURIComponent('Industrial storefront inquiry: ' + (selectedListing.title || 'Listing'))}`}
                                            className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:scale-[1.02] transition-all flex items-center justify-center gap-3 mb-3"
                                        >
                                            <i className="fa-solid fa-envelope"></i> Email Supplier
                                        </a>
                                    ) : (
                                        <button
                                            type="button"
                                            disabled
                                            className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-slate-500 text-sm font-bold uppercase tracking-wider mb-3 cursor-not-allowed"
                                        >
                                            Email Supplier
                                        </button>
                                    )}

                                </div>

                                <div className="glass-card p-6 rounded-2xl border border-white/5">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Listed By</h4>

                                    <div className="flex items-center gap-4 mb-5">
                                        {selectedListing.supplierLogoUrl ? (
                                            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10 shadow-inner">
                                                <img
                                                    src={selectedListing.supplierLogoUrl}
                                                    alt={selectedListing.supplierName}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-orange-400 border border-white/10 shadow-inner">
                                                <i className={`fa-solid ${selectedListing.supplierIcon || 'fa-industry'} text-xl`}></i>
                                            </div>
                                        )}
                                        <div>
                                            <div className="text-sm font-bold text-white mb-1">{selectedListing.supplierName || 'Unknown company'}</div>
                                            <div className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase border border-blue-500/20">
                                                <i className="fa-solid fa-circle-check"></i> Platform Member
                                            </div>
                                        </div>
                                    </div>

                                    <Link
                                        href={`/profile?id=${encodeURIComponent(selectedListing.profileId)}`}
                                        className="w-full py-2.5 rounded-lg border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-white/5 hover:text-white transition-all text-center block"
                                    >
                                        View Full Profile
                                    </Link>
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
        <>
            <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
                <Header breadcrumb="Industrial Storefront" />

                <div className="flex-1 overflow-y-auto p-8 relative">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <div className="text-orange-500 text-xs font-bold uppercase tracking-widest mb-1">
                                Explore
                            </div>
                            <h2 className="font-heading text-3xl font-bold text-white uppercase">Industrial Storefront</h2>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            {isMounted && isSupplierOrStorefront ? (
                                <div className="flex flex-col items-end gap-2">
                                    <Link
                                        href="/create-listing"
                                        className="bg-white/5 border border-white/10 text-white px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-white/10 transition-all inline-flex items-center"
                                    >
                                        <i className="fa-solid fa-plus mr-2"></i> Create Listing
                                    </Link>
                                </div>
                            ) : isMounted ? (
                                <Link
                                    href="/become-supplier?step=0"
                                    className="bg-gradient-to-r from-orange-500 to-red-600 border border-white/10 text-white px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-xs hover:shadow-neon transition-all inline-flex items-center"
                                >
                                    <i className="fa-solid fa-plus mr-2"></i> Create your industrial storefront profile
                                </Link>
                            ) : null}
                        </div>
                    </div>

                    <div className="inline-flex items-center bg-black/50 border border-white/10 rounded-xl p-1.5 mb-8">
                        <button
                            type="button"
                            onClick={() => setActiveTab('listings')}
                            className={`flex items-center gap-2 px-8 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'listings'
                                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <i className="fa-solid fa-cubes"></i> Listings
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('stores')}
                            className={`flex items-center gap-2 px-8 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'stores'
                                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <i className="fa-solid fa-industry"></i> Stores
                        </button>
                    </div>

                    {activeTab === 'listings' ? (
                        shops.length === 0 ? (
                            <div className="text-center py-12">
                                <i className="fa-solid fa-shop text-4xl text-slate-600 mb-4"></i>
                                <p className="text-slate-400 text-sm">No industrial storefront postings available yet.</p>
                            </div>
                        ) : (
                            <>
                                <div className="glass-card p-4 rounded-2xl flex flex-wrap items-center gap-4 mb-8">
                                    <div className="relative flex-[2] min-w-[220px] max-w-[520px]">
                                        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search for parts, materials, or capacity..."
                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-orange-500 outline-none transition-all placeholder:text-slate-500"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <select
                                            value={listingSort}
                                            onChange={(e) => setListingSort(e.target.value as any)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all cursor-pointer"
                                        >
                                            <option value="new-to-old">Newest first</option>
                                            <option value="old-to-new">Oldest first</option>
                                            <option value="price-high-low">Price: High to Low</option>
                                            <option value="price-low-high">Price: Low to High</option>
                                        </select>
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all cursor-pointer"
                                        >
                                            <option value="">All Categories</option>
                                            {listingCategories.map((category) => (
                                                <option key={category} value={category}>
                                                    {category}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            value={selectedProvince}
                                            onChange={(e) => setSelectedProvince(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all cursor-pointer"
                                        >
                                            <option value="">All Provinces</option>
                                            {CANADIAN_PROVINCES.map((prov) => (
                                                <option key={prov.code} value={prov.code}>
                                                    {prov.name} ({prov.code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Results Count */}
                                <div className="mb-4 text-sm text-slate-400">
                                    Showing <span className="text-white font-bold">{filteredShops.length}</span> of{' '}
                                    <span className="text-white font-bold">{shops.length}</span> listings
                                </div>

                                {filteredShops.length === 0 ? (
                                    <div className="text-center py-12">
                                        <i className="fa-solid fa-filter text-4xl text-slate-600 mb-4"></i>
                                        <p className="text-slate-400 text-sm">No listings match your search or category.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {filteredShops.map((shop) => (
                                            <div
                                                key={shop.listingId}
                                                className="glass-card rounded-2xl border border-white/5 hover:border-orange-500/50 transition-all duration-300 flex flex-col group overflow-hidden"
                                            >
                                                <div className="p-5 flex flex-col flex-grow">
                                                    {shop.listingType ? (
                                                        <div className="mb-3">
                                                            <span className="inline-flex px-2 py-1 text-[9px] font-bold uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded">
                                                                {shop.listingType}
                                                            </span>
                                                        </div>
                                                    ) : null}

                                                    <h3 className="font-heading font-bold text-white mb-1 line-clamp-1">
                                                        {shop.title || 'Untitled listing'}
                                                    </h3>
                                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-3 line-clamp-1">
                                                        <i className="fa-solid fa-store text-orange-400 mr-1"></i>
                                                        {shop.supplierName}
                                                    </p>

                                                    <p className="text-xs text-slate-400 line-clamp-1 mb-4">
                                                        {shop.description || 'No description available.'}
                                                    </p>

                                                    <div className="mt-auto flex items-end justify-between mb-4 gap-3">
                                                        <span className="text-xl font-black text-white truncate">
                                                            {shop.price || 'Negotiable'}
                                                        </span>
                                                        <span className="text-xs text-slate-400 shrink-0">
                                                            <i className="fa-solid fa-location-dot mr-1"></i>
                                                            {shop.location || 'N/A'}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-col gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedListing(shop)}
                                                            className="w-full py-2.5 rounded-lg bg-white/5 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors border border-white/5"
                                                        >
                                                            View Listing
                                                        </button>
                                                        {shop.supplierEmail ? (
                                                            <a
                                                                href={`mailto:${shop.supplierEmail}?subject=${encodeURIComponent('Industrial storefront inquiry: ' + (shop.title || 'Listing'))}`}
                                                                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all flex items-center justify-center gap-2 border border-transparent"
                                                            >
                                                                <i className="fa-solid fa-envelope"></i> Email Supplier
                                                            </a>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )
                    ) : (
                        stores.length === 0 ? (
                            <div className="text-center py-12">
                                <i className="fa-solid fa-building text-4xl text-slate-600 mb-4"></i>
                                <p className="text-slate-400 text-sm">No stores available yet.</p>
                            </div>
                        ) : (
                            <>
                                <div className="glass-card p-4 rounded-xl border border-white/5 mb-6">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="flex-1 min-w-[200px] relative">
                                            <input
                                                type="text"
                                                placeholder="Find manufacturers, equipment, or sourcing opportunities..."
                                                value={storeFilters.search}
                                                onChange={(e) => setStoreFilters({ ...storeFilters, search: e.target.value })}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 pl-10 text-sm font-semibold text-white placeholder:text-slate-500 focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                                            />
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                                <i className="fa-solid fa-magnifying-glass text-slate-400 text-sm"></i>
                                            </div>
                                        </div>

                                        <div className="min-w-[180px]">
                                            <select
                                                value={storeFilters.industry}
                                                onChange={(e) => setStoreFilters({ ...storeFilters, industry: e.target.value })}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all cursor-pointer"
                                            >
                                                <option value="">All Industries</option>
                                                {INDUSTRY_HUBS.map((hub) => (
                                                    <option key={hub} value={hub}>
                                                        {hub}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="min-w-[140px]">
                                            <select
                                                value={storeFilters.province}
                                                onChange={(e) => setStoreFilters({ ...storeFilters, province: e.target.value })}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all cursor-pointer"
                                            >
                                                <option value="">All Provinces</option>
                                                {CANADIAN_PROVINCES.map((province) => (
                                                    <option key={province.code} value={province.code}>
                                                        {province.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="min-w-[160px]">
                                            <select
                                                value={storeFilters.certification}
                                                onChange={(e) => setStoreFilters({ ...storeFilters, certification: e.target.value })}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all cursor-pointer"
                                            >
                                                <option value="">All Certifications</option>
                                                {CERTIFICATIONS.map((cert) => (
                                                    <option key={cert.code} value={cert.code}>
                                                        {cert.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {(storeFilters.search || storeFilters.industry || storeFilters.province || storeFilters.certification) && (
                                            <button
                                                onClick={() => setStoreFilters({ search: '', industry: '', province: '', certification: '' })}
                                                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider transition-all hover:text-white"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-4 text-sm text-slate-400">
                                    Showing <span className="text-white font-bold">{filteredStores.length}</span> of <span className="text-white font-bold">{stores.length}</span> stores
                                </div>

                                {filteredStores.length === 0 ? (
                                    <div className="text-center py-12">
                                        <i className="fa-solid fa-filter text-4xl text-slate-600 mb-4"></i>
                                        <p className="text-slate-400 text-sm">No stores match your filters.</p>
                                        <button
                                            onClick={() => setStoreFilters({ search: '', industry: '', province: '', certification: '' })}
                                            className="mt-4 px-4 py-2 rounded-lg bg-marcan-red text-white text-xs font-bold uppercase tracking-wider hover:shadow-neon transition-all"
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredStores.map((store) => (
                                            (() => {
                                                const industryLogo = getIndustryLogoForStore(store);
                                                const isStorefrontProfile = store.profileType === 'storefront';
                                                return (
                                                    <div
                                                        key={store.id}
                                                        className="glass-card p-6 rounded-2xl group hover:border-marcan-red/40 transition-all duration-300 flex flex-col relative"
                                                    >
                                                        {store.profileType === 'storefront' ? (
                                                            <span className="absolute top-4 right-4 px-2 py-1 rounded bg-orange-500/15 border border-orange-500/30 text-orange-300 text-[10px] font-bold uppercase tracking-wider">
                                                                Storefront
                                                            </span>
                                                        ) : null}
                                                        <div className="flex justify-between items-start mb-4">
                                                            {store.logoUrl ? (
                                                                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
                                                                    <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
                                                                </div>
                                                            ) : !isStorefrontProfile && industryLogo ? (
                                                                <div className={`w-12 h-12 rounded-lg ${industryLogo.bgClass} flex items-center justify-center`}>
                                                                    <i className={`fa-solid ${industryLogo.icon} ${industryLogo.iconClass}`}></i>
                                                                </div>
                                                            ) : isStorefrontProfile ? (
                                                                <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 border border-orange-500/20">
                                                                    <i className={`fa-solid ${store.icon || 'fa-shop'}`}></i>
                                                                </div>
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-slate-300 group-hover:text-marcan-red transition-colors">
                                                                    <i className={`fa-solid ${store.icon || 'fa-industry'}`}></i>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <h3 className="font-heading font-bold text-lg text-white mb-1">{store.name}</h3>
                                                        <p className="text-xs text-slate-500 uppercase mb-4">
                                                            <i className="fa-solid fa-location-dot"></i> {store.location}
                                                        </p>
                                                        <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                                                            {store.description || 'No description available.'}
                                                        </p>

                                                        {(store.tags && store.tags.length > 0) && (
                                                            <div className="mt-auto flex flex-wrap gap-2 mb-4">
                                                                {store.tags.map((tag: string) => (
                                                                    <span
                                                                        key={tag}
                                                                        className="px-2 py-1 rounded bg-white/5 border border-white/10 text-slate-400 text-[10px] font-bold uppercase"
                                                                    >
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <Link
                                                            href={`/profile?id=${encodeURIComponent(store.id)}`}
                                                            className="w-full py-2 rounded bg-white/5 hover:bg-marcan-red hover:text-white hover:shadow-neon text-slate-300 text-xs font-bold uppercase tracking-wider transition-all text-center block"
                                                        >
                                                            View Profile
                                                        </Link>
                                                    </div>
                                                );
                                            })()
                                        ))}
                                    </div>
                                )}
                            </>
                        )
                    )}
                </div>

            </main>
            {listingModal}
        </>
    );
}

