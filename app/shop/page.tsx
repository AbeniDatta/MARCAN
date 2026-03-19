'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';

type ShopListingCard = {
    // listing identifiers
    listingId: string;
    profileId: string;

    // company / seller profile display (enriched from /api/profiles)
    sellerName: string;
    sellerIcon: string;
    sellerLogoUrl?: string | null;
    sellerTags: string[];
    sellerEmail?: string | null;

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
    primaryIntent?: string;
};

type StoreCard = {
    id: string;
    name: string;
    location: string;
    description: string;
    icon: string;
    logoUrl?: string | null;
    tags: string[];
    primaryIntent?: string;
    email?: string | null;
};

export default function ShopPage() {
    const { isAuthenticated, user, isMounted } = useAuth();

    const [isShopOwner, setIsShopOwner] = useState(false);
    const [shops, setShops] = useState<ShopListingCard[]>([]);
    const [activeTab, setActiveTab] = useState<'listings' | 'stores'>('listings');
    const [stores, setStores] = useState<StoreCard[]>([]);
    const isSupplierOrStorefront = !!(isAuthenticated && (isShopOwner || user?.role === 'supplier'));

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
                    setIsShopOwner(false);
                    return;
                }

                const profile = await res.json();
                setIsShopOwner(
                    profile?.primaryIntent === 'sell' ||
                    profile?.primaryIntent === 'both' ||
                    profile?.primaryIntent === 'storefront'
                );
            } catch {
                setIsShopOwner(user?.role === 'supplier');
            }
        };

        runChecks();
    }, [isMounted, isAuthenticated, user?.email, user?.role]);

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
                const profileIds = new Set(listings.map((l: any) => l?.profileId).filter(Boolean));
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
                        const profile = profileById.get(l?.profileId);
                        if (!profile) return null;

                        const primaryIntent = profile?.primaryIntent;
                        const isSellerIntent =
                            primaryIntent === 'sell' ||
                            primaryIntent === 'both' ||
                            primaryIntent === 'storefront';
                        if (!isSellerIntent) return null;

                        return {
                            listingId: l?.id,
                            profileId: l?.profileId,

                            sellerName: l?.seller || profile?.name || 'Unknown',
                            sellerIcon: profile?.icon || 'fa-industry',
                            sellerLogoUrl: profile?.logoUrl,
                            sellerTags: profile?.tags || [],
                            sellerEmail: profile?.email || null,

                            title: l?.title || '',
                            listingType: l?.listingType || '',
                            price: l?.price || '',
                            location: l?.location || '',
                            description: l?.description || '',

                            badge: l?.badge,
                            badgeColor: l?.badgeColor,
                            icon: l?.icon,
                            primaryIntent,
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

    return (
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
                                href="/become-seller?step=0"
                                className="bg-gradient-to-r from-orange-500 to-red-600 border border-white/10 text-white px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-xs hover:shadow-neon transition-all inline-flex items-center"
                            >
                                <i className="fa-solid fa-plus mr-2"></i> Create your industrial storefront profile
                            </Link>
                        ) : null}
                    </div>
                </div>

                <div className="flex gap-3 mb-8">
                    <button
                        type="button"
                        onClick={() => setActiveTab('listings')}
                        className={`px-4 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'listings'
                            ? 'bg-orange-500/10 border-orange-500/50 text-orange-400'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                            }`}
                    >
                        listings
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('stores')}
                        className={`px-4 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'stores'
                            ? 'bg-orange-500/10 border-orange-500/50 text-orange-400'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                            }`}
                    >
                        stores
                    </button>
                </div>

                {activeTab === 'listings' ? (
                    shops.length === 0 ? (
                        <div className="text-center py-12">
                            <i className="fa-solid fa-shop text-4xl text-slate-600 mb-4"></i>
                            <p className="text-slate-400 text-sm">No industrial storefront postings available yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                            {shops.map((shop) => (
                                <div
                                    key={shop.listingId}
                                    className="glass-card rounded-xl overflow-hidden group hover:border-marcan-red/50 transition-all relative flex flex-col min-h-[240px]"
                                >
                                    {/* Subtle decorative gradient (keeps card visually “filled” without a blank black area). */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-transparent to-transparent opacity-60 pointer-events-none" />

                                    {shop.listingType ? (
                                        <div className="absolute top-3 left-3 z-20 px-2 py-0.5 text-[9px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30 rounded">
                                            {shop.listingType}
                                        </div>
                                    ) : null}

                                    <div className="relative z-10 p-5 pt-12 flex flex-col flex-grow">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase truncate">
                                            {shop.sellerName}
                                        </div>

                                        <h3 className="font-bold text-white text-sm uppercase truncate mt-1">
                                            {shop.title || 'Untitled listing'}
                                        </h3>

                                        {(shop.price || shop.location) && (
                                            <div className="text-[10px] text-slate-500 flex flex-col gap-1 mt-4">
                                                {shop.price ? (
                                                    <div className="inline-flex items-center">
                                                        <i className="fa-solid fa-tag mr-1 text-orange-400" />
                                                        {shop.price} <span className="text-slate-400 ml-1">CAD</span>
                                                    </div>
                                                ) : null}
                                                {shop.location ? (
                                                    <div className="inline-flex items-center">
                                                        <i className="fa-solid fa-location-dot mr-1" /> {shop.location}
                                                    </div>
                                                ) : null}
                                            </div>
                                        )}

                                        <p className="text-slate-400 text-xs mt-4 line-clamp-3 flex-grow">
                                            {shop.description || 'No description available.'}
                                        </p>

                                        <div className="mt-auto w-full space-y-2">
                                            <Link
                                                href={`/profile?id=${encodeURIComponent(shop.profileId)}`}
                                                className="w-full py-2 bg-white/5 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded hover:bg-marcan-red hover:text-white hover:shadow-neon transition-all text-center block"
                                            >
                                                View Company
                                            </Link>
                                            {shop.sellerEmail ? (
                                                <a
                                                    href={`mailto:${shop.sellerEmail}?subject=${encodeURIComponent('Industrial storefront inquiry: ' + (shop.title || 'Listing'))}`}
                                                    className="w-full py-2 bg-white/5 text-orange-400 text-[10px] font-bold uppercase tracking-wider rounded border border-orange-500/20 hover:bg-orange-500/10 hover:border-orange-500/40 transition-all text-center block"
                                                >
                                                    <i className="fa-solid fa-envelope mr-2" />
                                                    Email Company
                                                </a>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    stores.length === 0 ? (
                        <div className="text-center py-12">
                            <i className="fa-solid fa-building text-4xl text-slate-600 mb-4"></i>
                            <p className="text-slate-400 text-sm">No stores available yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                            {stores.map((store) => (
                                <div
                                    key={store.id}
                                    className="glass-card rounded-xl overflow-hidden group hover:border-marcan-red/50 transition-all relative flex flex-col min-h-[220px]"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-transparent to-transparent opacity-60 pointer-events-none" />

                                    <div className="absolute top-3 left-3 z-20 px-2 py-0.5 text-[9px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30 rounded">
                                        {store.primaryIntent === 'storefront' ? 'INDUSTRIAL STOREFRONT' : 'SUPPLIER'}
                                    </div>

                                    <div className="relative z-10 p-5 pt-12 flex flex-col flex-grow">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase truncate">
                                            {store.location}
                                        </div>

                                        <h3 className="font-bold text-white text-sm uppercase truncate mt-1">
                                            {store.name}
                                        </h3>

                                        <p className="text-slate-400 text-xs mt-4 line-clamp-3 flex-grow">
                                            {store.description || 'No description available.'}
                                        </p>

                                        <Link
                                            href={`/profile?id=${encodeURIComponent(store.id)}`}
                                            className="mt-auto w-full py-2 bg-white/5 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded hover:bg-marcan-red hover:text-white hover:shadow-neon transition-all text-center block"
                                        >
                                            View Company
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </main>
    );
}

