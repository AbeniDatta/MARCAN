'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';

export default function MyRequestsPage() {
  const { isAuthenticated, user, isMounted } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isMounted || !isAuthenticated || !user?.email) return;

    fetch(`/api/wishlist/my?userId=${encodeURIComponent(user.email)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch(() => setRequests([]));
  }, [isMounted, isAuthenticated, user?.email]);

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return requests;

    return requests.filter((r) => {
      const searchable = [
        r.title,
        r.category,
        r.specifications,
        r.description,
        r.quantity,
        r.targetPrice,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchable.includes(q);
    });
  }, [requests, searchQuery]);

  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="My Posts / Sourcing Requests" />

      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="flex justify-between items-end mb-6">
          <div>
            <div className="text-marcan-red text-xs font-bold uppercase tracking-widest mb-1">My Posts</div>
            <h2 className="font-heading text-3xl font-bold text-white uppercase">My Sourcing Requests</h2>
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
              placeholder="Search your sourcing requests..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-marcan-red outline-none transition-all placeholder:text-slate-500"
            />
          </div>
          <Link
            href="/post-request"
            className="bg-white/5 border border-white/10 text-white px-5 py-2 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-white/10 transition-all inline-flex items-center"
          >
            <i className="fa-solid fa-plus mr-2"></i> Post New Request
          </Link>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-bullhorn text-4xl text-slate-600 mb-4"></i>
            <p className="text-slate-400 text-sm">No sourcing requests found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="glass-card p-6 rounded-2xl flex flex-col md:flex-row gap-6 relative overflow-hidden group hover:border-marcan-red/30 transition-all"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-marcan-red shadow-neon opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-white font-bold text-sm uppercase tracking-wide">{request.title}</h4>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(request.createdAt || request.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded bg-white/5 text-slate-300 text-[10px] font-bold uppercase border border-white/10">
                      {request.category}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mb-2 leading-relaxed line-clamp-2">
                    {request.specifications || request.description}
                  </p>
                  <div className="flex gap-4 text-xs text-slate-500 flex-wrap">
                    {request.quantity && <span>Qty: {request.quantity}</span>}
                    {request.targetPrice && <span>Price: {request.targetPrice}</span>}
                    {request.deadline && <span>Deadline: {new Date(request.deadline).toLocaleDateString()}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

