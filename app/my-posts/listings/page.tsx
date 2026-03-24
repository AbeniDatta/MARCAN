'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';

export default function MyListingsPage() {
  const { isAuthenticated, user, isMounted } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isMounted || !isAuthenticated || !user?.email) return;

    fetch(`/api/listings/my?userId=${encodeURIComponent(user.email)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setListings(Array.isArray(data) ? data : []))
      .catch(() => setListings([]));
  }, [isMounted, isAuthenticated, user?.email]);

  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return listings;

    return listings.filter((l) => {
      const searchable = [l.title, l.listingType, l.location, l.description, l.price]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchable.includes(q);
    });
  }, [listings, searchQuery]);

  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="My Posts / Storefront Listings" />

      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="flex justify-between items-end mb-6">
          <div>
            <div className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-1">My Posts</div>
            <h2 className="font-heading text-3xl font-bold text-white uppercase">My Storefront Listings</h2>
          </div>
          <Link
            href="/my-account"
            className="text-xs text-slate-400 hover:text-white font-bold uppercase tracking-wider transition"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i> Back to My Account
          </Link>
        </div>

        <div className="glass-card p-4 rounded-2xl flex flex-wrap items-center gap-4 mb-8">
          <div className="relative flex-grow min-w-[200px]">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your storefront listings..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-orange-500 outline-none transition-all placeholder:text-slate-500"
            />
          </div>
          <Link
            href="/create-listing"
            className="bg-white/5 border border-white/10 text-white px-5 py-2 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-white/10 transition-all inline-flex items-center"
          >
            <i className="fa-solid fa-plus mr-2"></i> Create Listing
          </Link>
        </div>

        {filteredListings.length === 0 ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-shop text-4xl text-slate-600 mb-4"></i>
            <p className="text-slate-400 text-sm">No listings found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="glass-card rounded-2xl border border-white/5 hover:border-orange-500/50 transition-all duration-300 flex flex-col group overflow-hidden"
              >
                <div className="p-5 flex flex-col flex-grow">
                  {listing.listingType ? (
                    <div className="mb-3">
                      <span className="inline-flex px-2 py-1 text-[9px] font-bold uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded">
                        {listing.listingType}
                      </span>
                    </div>
                  ) : null}

                  <h3 className="font-heading font-bold text-white mb-1 line-clamp-1">{listing.title || 'Untitled listing'}</h3>

                  <p className="text-xs text-slate-400 line-clamp-1 mb-4">
                    {listing.description || 'No description available.'}
                  </p>

                  <div className="mt-auto flex items-end justify-between mb-4 gap-3">
                    <span className="text-xl font-black text-white truncate">{listing.price || 'Negotiable'}</span>
                    <span className="text-xs text-slate-400 shrink-0">
                      <i className="fa-solid fa-location-dot mr-1"></i>
                      {listing.location || 'N/A'}
                    </span>
                  </div>

                  <Link
                    href="/my-account"
                    className="w-full py-2.5 rounded-lg bg-white/5 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors border border-white/5 text-center"
                  >
                    Manage in My Account
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

