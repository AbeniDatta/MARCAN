'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

type TabType = 'companies' | 'listings' | 'requests';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState<TabType>('companies');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(query);
  const [results, setResults] = useState({
    companies: [] as any[],
    listings: [] as any[],
    requests: [] as any[],
    counts: { companies: 0, listings: 0, requests: 0 },
  });

  useEffect(() => {
    if (query) {
      performSearch(query);
    } else {
      setLoading(false);
    }
  }, [query]);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchTerm }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data);

      // Set default tab based on results
      if (data.counts.companies > 0) {
        setActiveTab('companies');
      } else if (data.counts.listings > 0) {
        setActiveTab('listings');
      } else if (data.counts.requests > 0) {
        setActiveTab('requests');
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="Search" />

      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-6xl mx-auto">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative group w-full">
              <div className="absolute -inset-1 bg-gradient-to-r from-marcan-red to-blue-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
              <label className="relative flex items-center justify-center bg-marcan-panel rounded-full border border-white/10 py-3 px-6 shadow-lg w-full cursor-text">
                <i className="fa-solid fa-magnifying-glass text-slate-400 text-lg mr-4"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find local partners, capabilities, or materials..."
                  className="bg-transparent text-white py-1 focus:outline-none placeholder:text-slate-500 font-medium text-lg text-left w-full"
                />
                <button
                  type="submit"
                  className="ml-4 bg-marcan-red text-white px-6 py-2 rounded-lg font-bold text-sm uppercase hover:shadow-neon transition-all"
                >
                  Search
                </button>
              </label>
            </div>
          </form>

          {query && (
            <>
              {/* Results Summary */}
              <div className="mb-6">
                <p className="text-slate-400 text-sm">
                  Found{' '}
                  <span className="text-white font-bold">
                    {results.counts.companies + results.counts.listings + results.counts.requests}
                  </span>{' '}
                  results for "{query}"
                </p>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b border-white/10">
                <button
                  onClick={() => setActiveTab('companies')}
                  className={`px-6 py-3 font-bold text-sm uppercase tracking-wider transition-all relative ${activeTab === 'companies'
                      ? 'text-marcan-red'
                      : 'text-slate-400 hover:text-white'
                    }`}
                >
                  Companies ({results.counts.companies})
                  {activeTab === 'companies' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-marcan-red"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('listings')}
                  className={`px-6 py-3 font-bold text-sm uppercase tracking-wider transition-all relative ${activeTab === 'listings'
                      ? 'text-marcan-red'
                      : 'text-slate-400 hover:text-white'
                    }`}
                >
                  Supplier Listings ({results.counts.listings})
                  {activeTab === 'listings' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-marcan-red"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`px-6 py-3 font-bold text-sm uppercase tracking-wider transition-all relative ${activeTab === 'requests'
                      ? 'text-marcan-red'
                      : 'text-slate-400 hover:text-white'
                    }`}
                >
                  Sourcing Requests ({results.counts.requests})
                  {activeTab === 'requests' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-marcan-red"></div>
                  )}
                </button>
              </div>

              {/* Results Content */}
              {loading ? (
                <div className="text-center py-12">
                  <i className="fa-solid fa-spinner fa-spin text-4xl text-marcan-red mb-4"></i>
                  <p className="text-slate-400">Searching...</p>
                </div>
              ) : (
                <>
                  {/* Companies Tab */}
                  {activeTab === 'companies' && (
                    <div className="space-y-4">
                      {results.companies.length === 0 ? (
                        <div className="text-center py-12">
                          <i className="fa-solid fa-building text-4xl text-slate-600 mb-4"></i>
                          <p className="text-slate-400">No companies found.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {results.companies.map((company) => (
                            <Link
                              key={company.id}
                              href={`/profile?id=${company.id}`}
                              className="glass-card p-6 rounded-2xl group hover:border-marcan-red/40 transition-all duration-300 flex flex-col"
                            >
                              <div className="flex justify-between items-start mb-4">
                                {company.logoUrl ? (
                                  <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
                                    <img
                                      src={company.logoUrl}
                                      alt={company.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-slate-300 group-hover:text-marcan-red transition-colors">
                                    <i
                                      className={`fa-solid ${company.selectedIcon || 'fa-industry'}`}
                                    ></i>
                                  </div>
                                )}
                              </div>
                              <h3 className="font-heading font-bold text-lg text-white mb-1">
                                {company.name}
                              </h3>
                              {company.location && (
                                <p className="text-xs text-slate-500 uppercase mb-4">
                                  <i className="fa-solid fa-location-dot"></i> {company.location}
                                </p>
                              )}
                              {company.description && (
                                <p className="text-slate-400 text-xs mb-4 leading-relaxed line-clamp-2">
                                  {company.description}
                                </p>
                              )}
                              {company.capabilities && company.capabilities.length > 0 && (
                                <div className="mt-auto flex flex-wrap gap-2 mb-4">
                                  {company.capabilities.slice(0, 3).map((cap: string, idx: number) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 rounded bg-white/5 border border-white/10 text-slate-400 text-[10px] font-bold uppercase"
                                    >
                                      {cap}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="w-full py-2 rounded bg-white/5 hover:bg-marcan-red hover:text-white hover:shadow-neon text-slate-300 text-xs font-bold uppercase tracking-wider transition-all text-center">
                                View Profile
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Listings Tab */}
                  {activeTab === 'listings' && (
                    <div className="space-y-4">
                      {results.listings.length === 0 ? (
                        <div className="text-center py-12">
                          <i className="fa-solid fa-shop text-4xl text-slate-600 mb-4"></i>
                          <p className="text-slate-400">No supplier listings found.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                          {results.listings.map((listing) => (
                            <div
                              key={listing.id}
                              className="glass-card rounded-xl overflow-hidden group hover:border-marcan-red/50 transition-all"
                            >
                              <div className="h-40 bg-black/40 flex items-center justify-center text-slate-600 relative">
                                {listing.logoUrl ? (
                                  <img
                                    src={listing.logoUrl}
                                    alt={listing.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <i
                                    className={`fa-solid ${listing.selectedIcon || 'fa-box'} text-4xl group-hover:text-white transition-colors group-hover:scale-110 duration-500`}
                                  ></i>
                                )}
                              </div>
                              <div className="p-4 border-t border-white/5">
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-bold text-white text-sm uppercase truncate">
                                    {listing.title}
                                  </h3>
                                  {listing.price && (
                                    <span className="font-bold text-marcan-red text-sm ml-2">
                                      {listing.price}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 mb-2">
                                  Seller: {listing.seller}
                                </div>
                                {listing.location && (
                                  <div className="text-[10px] text-slate-500 mb-4">
                                    <i className="fa-solid fa-location-dot mr-1"></i> {listing.location}
                                  </div>
                                )}
                                {listing.description && (
                                  <p className="text-slate-400 text-xs mb-4 line-clamp-2">
                                    {listing.description}
                                  </p>
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
                  )}

                  {/* Requests Tab */}
                  {activeTab === 'requests' && (
                    <div className="space-y-4">
                      {results.requests.length === 0 ? (
                        <div className="text-center py-12">
                          <i className="fa-solid fa-bullhorn text-4xl text-slate-600 mb-4"></i>
                          <p className="text-slate-400">No sourcing requests found.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {results.requests.map((request) => (
                            <div
                              key={request.id}
                              className="glass-card p-6 rounded-2xl flex flex-col md:flex-row gap-6 relative overflow-hidden group hover:border-marcan-red/30 transition-all"
                            >
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-marcan-red shadow-neon opacity-50 group-hover:opacity-100 transition-opacity"></div>

                              <div className="flex-shrink-0">
                                {request.logoUrl ? (
                                  <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
                                    <img
                                      src={request.logoUrl}
                                      alt={request.company}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center font-heading font-bold text-white border border-white/10">
                                    {getInitials(request.company)}
                                  </div>
                                )}
                              </div>
                              <div className="flex-grow">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h4 className="text-white font-bold text-sm uppercase tracking-wide">
                                      {request.title}
                                    </h4>
                                    <div className="text-xs text-slate-500">
                                      by {request.company}
                                    </div>
                                  </div>
                                  {request.category && (
                                    <span className="px-2 py-1 rounded bg-white/5 text-slate-300 text-[10px] font-bold uppercase border border-white/10">
                                      {request.category}
                                    </span>
                                  )}
                                </div>
                                {request.description && (
                                  <p className="text-slate-400 text-sm leading-relaxed mb-2">
                                    {request.description}
                                  </p>
                                )}
                                <div className="flex gap-4 text-xs text-slate-500">
                                  {request.quantity && <span>Quantity: {request.quantity}</span>}
                                  {request.targetPrice && (
                                    <span className="text-marcan-red font-bold">
                                      Target: {request.targetPrice}
                                    </span>
                                  )}
                                  {request.deadline && (
                                    <span>
                                      Deadline: {new Date(request.deadline).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
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
                  )}
                </>
              )}
            </>
          )}

          {!query && (
            <div className="text-center py-12">
              <i className="fa-solid fa-magnifying-glass text-4xl text-slate-600 mb-4"></i>
              <p className="text-slate-400">Enter a search query to find companies, listings, and sourcing requests.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
          <Header breadcrumb="Search" />
          <div className="flex-1 overflow-y-auto p-8 relative">
            <div className="text-center py-12">
              <p className="text-slate-400">Loading...</p>
            </div>
          </div>
        </main>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
