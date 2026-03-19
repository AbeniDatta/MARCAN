'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';

type ShopProfileCard = {
    id: string;
    name: string;
    location: string;
    description: string;
    icon: string;
    logoUrl?: string | null;
    tags: string[];
    primaryIntent?: string;
};

export default function ShopPage() {
    const { isAuthenticated, user, isMounted } = useAuth();

    const [isShopOwner, setIsShopOwner] = useState(false);
    const [shops, setShops] = useState<ShopProfileCard[]>([]);
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
                setIsShopOwner(profile?.primaryIntent === 'sell' || profile?.primaryIntent === 'both');
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

                const profileIds = new Set(
                    (Array.isArray(listingsData) ? listingsData : [])
                        .map((l: any) => l?.profileId)
                        .filter(Boolean)
                );

                const profilesRes = await fetch('/api/profiles');
                if (!profilesRes.ok) throw new Error('Failed to fetch profiles');
                const profilesData = await profilesRes.json();

                const sellerProfiles = (Array.isArray(profilesData) ? profilesData : []).filter(
                    (p: ShopProfileCard) => {
                        const isSellerIntent = p.primaryIntent === 'sell' || p.primaryIntent === 'both';
                        const hasPosting = profileIds.has(p.id);
                        return isSellerIntent && hasPosting;
                    }
                );

                setShops(sellerProfiles);
            } catch (err) {
                console.error('Error fetching posted shops:', err);
                setShops([]);
            }
        };

        fetchPostedShops();
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

                {shops.length === 0 ? (
                    <div className="text-center py-12">
                        <i className="fa-solid fa-shop text-4xl text-slate-600 mb-4"></i>
                        <p className="text-slate-400 text-sm">No industrial storefront postings available yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        {shops.map((shop) => (
                            <div
                                key={shop.id}
                                className="glass-card rounded-xl overflow-hidden group hover:border-marcan-red/50 transition-all"
                            >
                                <div className="h-40 bg-black/40 flex items-center justify-center text-slate-600 relative">
                                    <i
                                        className={`fa-solid ${shop.icon} text-4xl group-hover:text-white transition-colors group-hover:scale-110 duration-500`}
                                    />
                                    {shop.tags?.[0] ? (
                                        <div className="absolute top-2 left-2 px-2 py-0.5 text-[9px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30 rounded">
                                            {shop.tags[0]}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="p-4 border-t border-white/5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-white text-sm uppercase truncate">{shop.name}</h3>
                                        <span className="font-bold text-marcan-red text-sm">Industrial Storefront</span>
                                    </div>

                                    {shop.location && (
                                        <div className="text-[10px] text-slate-500 mb-4">
                                            <i className="fa-solid fa-location-dot mr-1"></i> {shop.location}
                                        </div>
                                    )}

                                    <p className="text-slate-400 text-xs mb-4 line-clamp-2">
                                        {shop.description || 'No description available.'}
                                    </p>

                                    <Link
                                        href={`/profile?id=${encodeURIComponent(shop.id)}`}
                                        className="w-full py-2 bg-white/5 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded hover:bg-marcan-red hover:text-white hover:shadow-neon transition-all text-center"
                                    >
                                        View Industrial Storefront Profile
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}

