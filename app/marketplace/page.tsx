'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';

export default function MarketplacePage() {
  const { isAuthenticated } = useAuth();
  const listings = [
    {
      title: 'Steel Injection Molds',
      price: '$1,200',
      seller: 'Ontario Plastics',
      badge: 'Liquidation',
      badgeColor: 'red',
      icon: 'fa-dolly',
    },
    {
      title: 'Carbide End Mills',
      price: '$450',
      seller: 'ToolSupply CA',
      badge: 'Surplus',
      badgeColor: 'blue',
      icon: 'fa-shapes',
    },
  ];

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
          {isAuthenticated ? (
            <button className="bg-white/5 border border-white/10 text-white px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-white/10 transition-all">
              Create Listing
            </button>
          ) : (
            <Link
              href="/login"
              className="bg-white/5 border border-white/10 text-white px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-white/10 transition-all inline-block"
            >
              Login to Create Listing
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {listings.map((listing, index) => (
            <div
              key={index}
              className="glass-card rounded-xl overflow-hidden group hover:border-marcan-red/50 transition-all"
            >
              <div className="h-40 bg-black/40 flex items-center justify-center text-slate-600 relative">
                <i className={`fa-solid ${listing.icon} text-4xl group-hover:text-white transition-colors group-hover:scale-110 duration-500`}></i>
                <div
                  className={`absolute top-2 left-2 px-2 py-0.5 bg-${listing.badgeColor}-500/20 text-${listing.badgeColor}-400 border border-${listing.badgeColor}-500/30 text-[9px] font-bold uppercase`}
                >
                  {listing.badge}
                </div>
              </div>
              <div className="p-4 border-t border-white/5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-white text-sm uppercase truncate">{listing.title}</h3>
                  <span className="font-bold text-marcan-red text-sm">{listing.price}</span>
                </div>
                <div className="text-[10px] text-slate-500 mb-4">Seller: {listing.seller}</div>
                <button className="w-full py-2 bg-white/5 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded hover:bg-marcan-red hover:text-white hover:shadow-neon transition-all">
                  View Listing
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
