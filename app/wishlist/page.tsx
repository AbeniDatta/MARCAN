'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';

type FilterOption = 'new-to-old' | 'old-to-new' | 'price-high-low' | 'price-low-high' | 'category';

export default function WishlistPage() {
  const { isAuthenticated, isMounted, user } = useAuth();
  const [filter, setFilter] = useState<FilterOption>('new-to-old');
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    // Fetch requests from API
    const fetchRequests = async () => {
      try {
        const response = await fetch('/api/wishlist');
        if (!response.ok) {
          throw new Error('Failed to fetch requests');
        }
        const data = await response.json();

        // Format time for display
        const formattedRequests = data.map((req: any) => {
          const timeAgo = getTimeAgo(req.timestamp || new Date(req.createdAt).getTime());
          return {
            ...req,
            time: timeAgo,
            description: req.specifications || req.description,
          };
        });

        setRequests(formattedRequests);
      } catch (error) {
        console.error('Error fetching wishlist requests:', error);
        setRequests([]);
      }
    };

    fetchRequests();
  }, []);

  // Helper function to calculate time ago
  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'min' : 'mins'} ago`;
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  };

  // Filter and sort requests
  const filteredRequests = useMemo(() => {
    let sorted = [...requests];

    switch (filter) {
      case 'new-to-old':
        sorted.sort((a, b) => (b.timestamp || new Date(b.createdAt).getTime()) - (a.timestamp || new Date(a.createdAt).getTime()));
        break;
      case 'old-to-new':
        sorted.sort((a, b) => (a.timestamp || new Date(a.createdAt).getTime()) - (b.timestamp || new Date(b.createdAt).getTime()));
        break;
      case 'price-high-low':
        sorted.sort((a, b) => {
          const priceA = parseFloat((a.targetPrice || '0').replace(/[^0-9.]/g, '')) || 0;
          const priceB = parseFloat((b.targetPrice || '0').replace(/[^0-9.]/g, '')) || 0;
          return priceB - priceA;
        });
        break;
      case 'price-low-high':
        sorted.sort((a, b) => {
          const priceA = parseFloat((a.targetPrice || '0').replace(/[^0-9.]/g, '')) || 0;
          const priceB = parseFloat((b.targetPrice || '0').replace(/[^0-9.]/g, '')) || 0;
          return priceA - priceB;
        });
        break;
      case 'category':
        sorted.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
        break;
    }

    return sorted;
  }, [requests, filter]);

  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="Buyer Wishlist" />

      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="text-marcan-red text-xs font-bold uppercase tracking-widest mb-1">Recent Requests</div>
            <h2 className="font-heading text-3xl font-bold text-white uppercase">Buyer Wishlist</h2>
          </div>
          <div className="flex flex-col items-end gap-2">
            {isMounted && isAuthenticated ? (
              <Link
                href="/post-request"
                className="bg-marcan-red text-white px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-xs hover:shadow-neon transition-all inline-flex items-center"
              >
                <i className="fa-solid fa-plus mr-2"></i> Post Request
              </Link>
            ) : (
              <>
                <button
                  disabled
                  className="bg-slate-600/50 text-slate-400 px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-xs cursor-not-allowed opacity-50 inline-flex items-center"
                >
                  <i className="fa-solid fa-plus mr-2"></i> Post Request
                </button>
                {isMounted && (
                  <p className="text-xs text-slate-500 text-right max-w-[200px]">
                    Please <Link href="/login" className="text-marcan-red hover:text-marcan-red/80 underline">log in</Link> or <Link href="/signup" className="text-marcan-red hover:text-marcan-red/80 underline">sign up</Link> to post a request
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-bold uppercase">Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterOption)}
              className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-marcan-red outline-none"
            >
              <option value="new-to-old">New to Old</option>
              <option value="old-to-new">Old to New</option>
              <option value="price-high-low">Price: High to Low</option>
              <option value="price-low-high">Price: Low to High</option>
              <option value="category">By Category</option>
            </select>
          </div>
          <div className="text-xs text-slate-500">
            {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'}
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-bullhorn text-4xl text-slate-600 mb-4"></i>
            <p className="text-slate-400 text-sm">No wishlist requests available yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request, index) => (
              <div
                key={index}
                className="glass-card p-6 rounded-2xl flex flex-col md:flex-row gap-6 relative overflow-hidden group hover:border-marcan-red/30 transition-all"
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 shadow-neon opacity-50 group-hover:opacity-100 transition-opacity ${request.active ? 'bg-marcan-red' : 'bg-slate-600 group-hover:bg-marcan-red'
                    }`}
                ></div>

                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center font-heading font-bold text-white border border-white/10">
                    {request.initials}
                  </div>
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-white font-bold text-sm uppercase tracking-wide">{request.title || request.company}</h4>
                      <div className="text-xs text-slate-500">{request.time || 'Recently posted'}</div>
                      {request.company && request.company !== request.title && (
                        <div className="text-xs text-slate-400 mt-1">by {request.company}</div>
                      )}
                    </div>
                    <span className="px-2 py-1 rounded bg-white/5 text-slate-300 text-[10px] font-bold uppercase border border-white/10">
                      {request.category}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{request.description || request.specifications}</p>
                  {request.quantity && (
                    <div className="mt-2 text-xs text-slate-500">
                      Quantity: {request.quantity}
                    </div>
                  )}
                  {request.targetPrice && (
                    <div className="mt-2 text-xs text-marcan-red font-bold">
                      Target Price: {request.targetPrice}
                    </div>
                  )}
                  {request.deadline && (
                    <div className="mt-1 text-xs text-slate-500">
                      Deadline: {new Date(request.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  <button className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-marcan-red hover:bg-marcan-red hover:text-white hover:shadow-neon transition-all">
                    <i className="fa-solid fa-envelope"></i>
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
