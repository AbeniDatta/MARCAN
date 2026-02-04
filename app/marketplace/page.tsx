'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';

export default function MarketplacePage() {
  const { isAuthenticated, user, isMounted } = useAuth();
  const isSeller = user && (user.role === 'sell' || user.role === 'both');
  const [listings, setListings] = useState<any[]>([]);

  useEffect(() => {
    // Fetch listings from API
    const fetchListings = async () => {
      try {
        const response = await fetch('/api/listings');
        if (!response.ok) {
          throw new Error('Failed to fetch listings');
        }
        const data = await response.json();
        setListings(data);
      } catch (error) {
        console.error('Error fetching listings:', error);
        setListings([]);
      }
    };

    fetchListings();
  }, []);

  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="Supplier Listings" />

      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="text-marcan-red text-xs font-bold uppercase tracking-widest mb-1">
              Supplier Listings
            </div>
            <h2 className="font-heading text-3xl font-bold text-white uppercase">Supplier Listings</h2>
          </div>
          <div className="flex flex-col items-end gap-2">
            {isMounted && isAuthenticated && isSeller ? (
              <Link
                href="/create-listing"
                className="bg-white/5 border border-white/10 text-white px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-white/10 transition-all inline-flex items-center"
              >
                <i className="fa-solid fa-plus mr-2"></i> Create Listing
              </Link>
            ) : isMounted && isAuthenticated ? (
              <>
                <button
                  disabled
                  className="bg-slate-600/50 border border-slate-600/50 text-slate-400 px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-xs cursor-not-allowed opacity-50 inline-flex items-center"
                >
                  <i className="fa-solid fa-plus mr-2"></i> Create Listing
                </button>
                <p className="text-xs text-slate-500 text-right max-w-[200px]">
                  <Link href="/become-seller" className="text-marcan-red hover:text-marcan-red/80 underline">Become a Seller</Link> to create listings
                </p>
              </>
            ) : isMounted ? (
              <>
                <button
                  disabled
                  className="bg-slate-600/50 border border-slate-600/50 text-slate-400 px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-xs cursor-not-allowed opacity-50 inline-flex items-center"
                >
                  <i className="fa-solid fa-plus mr-2"></i> Create Listing
                </button>
                <p className="text-xs text-slate-500 text-right max-w-[200px]">
                  Please <Link href="/login" className="text-marcan-red hover:text-marcan-red/80 underline">log in</Link> or <Link href="/signup" className="text-marcan-red hover:text-marcan-red/80 underline">sign up</Link> to create a listing
                </p>
              </>
            ) : (
              <div className="bg-white/5 border border-white/10 text-white px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-xs inline-block opacity-50">
                Create Listing
              </div>
            )}
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-shop text-4xl text-slate-600 mb-4"></i>
            <p className="text-slate-400 text-sm">No supplier listings available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="glass-card rounded-xl overflow-hidden group hover:border-marcan-red/50 transition-all"
              >
                <div className="h-40 bg-black/40 flex items-center justify-center text-slate-600 relative">
                  <i className={`fa-solid ${listing.icon} text-4xl group-hover:text-white transition-colors group-hover:scale-110 duration-500`}></i>
                  <div
                    className={`absolute top-2 left-2 px-2 py-0.5 text-[9px] font-bold uppercase ${listing.badgeColor === 'red'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : listing.badgeColor === 'blue'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : listing.badgeColor === 'green'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : listing.badgeColor === 'purple'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                      }`}
                  >
                    {listing.badge}
                  </div>
                </div>
                <div className="p-4 border-t border-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white text-sm uppercase truncate">{listing.title}</h3>
                    <span className="font-bold text-marcan-red text-sm">{listing.price}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mb-2">Seller: {listing.seller}</div>
                  {listing.location && (
                    <div className="text-[10px] text-slate-500 mb-4">
                      <i className="fa-solid fa-location-dot mr-1"></i> {listing.location}
                    </div>
                  )}
                  <button className="w-full py-2 bg-white/5 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded hover:bg-marcan-red hover:text-white hover:shadow-neon transition-all">
                    View Listing
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
