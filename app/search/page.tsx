'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

type TabType = 'companies' | 'listings' | 'requests';

const INDUSTRY_HUBS = ['Precision Machining', 'Foundries & Casting', 'Surface Finishing', 'Tooling & Molds', 'Automation'];
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
const PROVINCE_NAME_BY_CODE = new Map(CANADIAN_PROVINCES.map((p) => [p.code, p.name.toLowerCase()]));

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState<TabType>('companies');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(query);
  const [filters, setFilters] = useState({
    industry: '',
    province: '',
    certification: '',
  });
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

  const filteredCompanies = useMemo(() => {
    return results.companies.filter((company) => {
      if (filters.industry) {
        const companyIndustries = Array.isArray(company.industryHubs) ? company.industryHubs : [];
        const hasIndustry = companyIndustries.some(
          (hub: string) => String(hub).toLowerCase() === filters.industry.toLowerCase()
        );
        if (!hasIndustry) return false;
      }

      if (filters.province) {
        const companyProvinceRaw = String(company.province || '').trim();
        const provinceFromField = companyProvinceRaw.toUpperCase();
        const provinceFromLocation = String(company.location || '')
          .split(',')
          .pop()
          ?.trim()
          .toUpperCase() || '';
        const targetCode = filters.province.toUpperCase();
        const targetName = PROVINCE_NAME_BY_CODE.get(targetCode) || '';
        const companyProvinceName = companyProvinceRaw.toLowerCase();
        const locationProvinceName = String(company.location || '').toLowerCase();

        const isMatch =
          provinceFromField === targetCode ||
          provinceFromLocation === targetCode ||
          companyProvinceName === targetName ||
          locationProvinceName.includes(targetName);
        if (!isMatch) return false;
      }

      if (filters.certification) {
        const companyCerts = Array.isArray(company.certifications) ? company.certifications : [];
        const certMatches = companyCerts.some((cert: any) => {
          if (typeof cert === 'string') {
            return cert.toLowerCase() === filters.certification.toLowerCase();
          }
          return (
            String(cert.code || '').toLowerCase() === filters.certification.toLowerCase() ||
            String(cert.name || '').toLowerCase() === filters.certification.toLowerCase()
          );
        });
        if (!certMatches) return false;
      }

      return true;
    });
  }, [results.companies, filters]);

  const filteredListings = useMemo(() => {
    return results.listings.filter((listing) => {
      if (filters.industry) {
        const haystack = `${listing.listingType || ''} ${listing.title || ''} ${listing.description || ''}`.toLowerCase();
        if (!haystack.includes(filters.industry.toLowerCase())) return false;
      }

      if (filters.province) {
        const targetCode = filters.province.toUpperCase();
        const targetName = PROVINCE_NAME_BY_CODE.get(targetCode) || '';
        const locationSuffix = String(listing.location || '').split(',').pop()?.trim().toUpperCase() || '';
        const sellerProvince = String(listing.sellerProvince || '').toUpperCase();
        const locationText = String(listing.location || '').toLowerCase();
        const provinceMatch =
          locationSuffix === targetCode ||
          sellerProvince === targetCode ||
          locationText.includes(targetName);
        if (!provinceMatch) return false;
      }

      if (filters.certification) {
        const certs = Array.isArray(listing.sellerCertifications) ? listing.sellerCertifications : [];
        const certMatch = certs.some((cert: any) => {
          if (typeof cert === 'string') return cert.toLowerCase() === filters.certification.toLowerCase();
          return (
            String(cert.code || '').toLowerCase() === filters.certification.toLowerCase() ||
            String(cert.name || '').toLowerCase() === filters.certification.toLowerCase()
          );
        });
        if (!certMatch) return false;
      }

      return true;
    });
  }, [results.listings, filters]);

  const filteredRequests = useMemo(() => {
    return results.requests.filter((request) => {
      if (filters.industry) {
        const haystack = `${request.category || ''} ${request.title || ''} ${request.description || ''}`.toLowerCase();
        if (!haystack.includes(filters.industry.toLowerCase())) return false;
      }

      if (filters.province) {
        const targetCode = filters.province.toUpperCase();
        const targetName = PROVINCE_NAME_BY_CODE.get(targetCode) || '';
        const requestProvince = String(request.province || '').toUpperCase();
        const haystack = `${request.title || ''} ${request.description || ''} ${request.category || ''}`.toLowerCase();
        if (!(requestProvince === targetCode || haystack.includes(targetName))) return false;
      }

      if (filters.certification) {
        const haystack = `${request.title || ''} ${request.description || ''} ${request.category || ''}`.toLowerCase();
        if (!haystack.includes(filters.certification.toLowerCase())) return false;
      }

      return true;
    });
  }, [results.requests, filters]);

  const filteredCounts = useMemo(
    () => ({
      companies: filteredCompanies.length,
      listings: filteredListings.length,
      requests: filteredRequests.length,
      total: filteredCompanies.length + filteredListings.length + filteredRequests.length,
    }),
    [filteredCompanies.length, filteredListings.length, filteredRequests.length]
  );

  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="Search" />

      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-6xl mx-auto">
          {/* Search Bar - matches homepage styling */}
          <form onSubmit={handleSearch} className="mb-4 w-full">
            <div className="relative group w-full max-w-5xl mx-auto">
              {/* Enhanced AI Gradient Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-marcan-red via-orange-500 to-blue-600 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-500"></div>

              <label className="relative flex items-center justify-center bg-marcan-panel rounded-full border border-white/10 p-2 pl-6 shadow-lg w-full cursor-text">
                {/* AI Icon */}
                <i className="fa-solid fa-wand-magic-sparkles text-transparent bg-clip-text bg-gradient-to-r from-marcan-red to-orange-500 text-xl mr-4"></i>

                {/* Prompt-style Input */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch(e);
                    }
                  }}
                  placeholder="Describe what you need (e.g., 'ISO 9001 CNC shops near Toronto')..."
                  className="bg-transparent text-white py-2 focus:outline-none placeholder:text-slate-500 font-medium text-base md:text-lg text-left w-full"
                />

                {/* AI Action Button */}
                <button
                  type="submit"
                  className="hidden sm:flex bg-white/5 hover:bg-marcan-red text-white px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all ml-2 items-center gap-2 border border-white/10 hover:border-marcan-red hover:shadow-neon shrink-0"
                >
                  Ask Our AI <i className="fa-solid fa-arrow-right"></i>
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
                    {filteredCounts.total}
                  </span>{' '}
                  results for "{query}"
                </p>
              </div>

              {/* Global Filters */}
              <div className="glass-card p-4 rounded-xl border border-white/5 mb-6">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-[180px]">
                    <select
                      value={filters.industry}
                      onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
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
                      value={filters.province}
                      onChange={(e) => setFilters({ ...filters, province: e.target.value })}
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
                      value={filters.certification}
                      onChange={(e) => setFilters({ ...filters, certification: e.target.value })}
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

                  {(filters.industry || filters.province || filters.certification) && (
                    <button
                      onClick={() => setFilters({ industry: '', province: '', certification: '' })}
                      className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider transition-all hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>
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
                  Companies ({filteredCounts.companies})
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
                  Storefront Listings ({filteredCounts.listings})
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
                  Sourcing Requests ({filteredCounts.requests})
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
                      {filteredCompanies.length === 0 ? (
                        <div className="text-center py-12">
                          <i className="fa-solid fa-building text-4xl text-slate-600 mb-4"></i>
                          <p className="text-slate-400">
                            {results.companies.length === 0 ? 'No companies found.' : 'No companies match your filters.'}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredCompanies.map((company) => (
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
                      {filteredListings.length === 0 ? (
                        <div className="text-center py-12">
                          <i className="fa-solid fa-shop text-4xl text-slate-600 mb-4"></i>
                          <p className="text-slate-400">
                            {results.listings.length === 0 ? 'No supplier listings found.' : 'No supplier listings match your filters.'}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                          {filteredListings.map((listing) => (
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
                      {filteredRequests.length === 0 ? (
                        <div className="text-center py-12">
                          <i className="fa-solid fa-bullhorn text-4xl text-slate-600 mb-4"></i>
                          <p className="text-slate-400">
                            {results.requests.length === 0 ? 'No sourcing requests found.' : 'No sourcing requests match your filters.'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredRequests.map((request) => (
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
