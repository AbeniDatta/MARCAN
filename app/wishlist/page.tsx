'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';

export default function WishlistPage() {
  const { isAuthenticated } = useAuth();
  const requests = [
    {
      company: 'AerospaceComposites',
      initials: 'AC',
      time: '2 mins ago',
      category: 'Machining',
      description:
        'Requesting 5-Axis machining for Titanium Grade 5 brackets. Quantity: 50 units. Tolerance requirement: ±0.002mm. Keywords: Titanium, 5-Axis.',
      active: true,
    },
    {
      company: 'MetalWorks Co.',
      initials: 'MW',
      time: '5 hours ago',
      category: 'Finishing',
      description:
        'Batch Anodizing required. Type II Black. 200 Aluminum casings. Looking for Kitchener/Waterloo local partner.',
      active: false,
    },
  ];

  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="Buyer Wishlist" />

      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="text-marcan-red text-xs font-bold uppercase tracking-widest mb-1">Recent Requests</div>
            <h2 className="font-heading text-3xl font-bold text-white uppercase">Buyer Wishlist</h2>
          </div>
          {isAuthenticated ? (
            <button className="bg-marcan-red text-white px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-xs hover:shadow-neon transition-all">
              <i className="fa-solid fa-plus mr-2"></i> Post Request
            </button>
          ) : (
            <Link
              href="/login"
              className="bg-marcan-red text-white px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-xs hover:shadow-neon transition-all inline-flex items-center"
            >
              <i className="fa-solid fa-plus mr-2"></i> Login to Post Request
            </Link>
          )}
        </div>

        <div className="space-y-4">
          {requests.map((request, index) => (
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
                    <h4 className="text-white font-bold text-sm uppercase tracking-wide">{request.company}</h4>
                    <div className="text-xs text-slate-500">{request.time}</div>
                  </div>
                  <span className="px-2 py-1 rounded bg-white/5 text-slate-300 text-[10px] font-bold uppercase border border-white/10">
                    {request.category}
                  </span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{request.description}</p>
              </div>
              <div className="flex items-center">
                <button className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-marcan-red hover:bg-marcan-red hover:text-white hover:shadow-neon transition-all">
                  <i className="fa-solid fa-envelope"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
