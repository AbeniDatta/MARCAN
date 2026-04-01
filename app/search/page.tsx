'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import StorefrontListingModal, { type StorefrontListingModalData } from '@/components/StorefrontListingModal';
import { useI18n } from '@/contexts/I18nContext';
import { INDUSTRY_HUBS_EN as INDUSTRY_HUBS } from '@/lib/industryHubNormalize';

type TabType = 'companies' | 'listings' | 'requests';

const INDUSTRY_LOGOS: Record<string, { icon: string; bgClass: string; iconClass: string }> = {
  'Precision Machining': {
    icon: 'fa-microchip',
    bgClass: 'bg-blue-500/10',
    iconClass: 'text-blue-400',
  },
  'Foundries & Casting': {
    icon: 'fa-fire',
    bgClass: 'bg-orange-500/10',
    iconClass: 'text-orange-400',
  },
  'Surface Finishing': {
    icon: 'fa-spray-can-sparkles',
    bgClass: 'bg-purple-500/10',
    iconClass: 'text-purple-400',
  },
  'Tooling & Molds': {
    icon: 'fa-screwdriver-wrench',
    bgClass: 'bg-green-500/10',
    iconClass: 'text-green-400',
  },
  Automation: {
    icon: 'fa-robot',
    bgClass: 'bg-cyan-500/10',
    iconClass: 'text-cyan-400',
  },
  'Additive Manufacturing': {
    icon: 'fa-cubes',
    bgClass: 'bg-fuchsia-500/10',
    iconClass: 'text-fuchsia-400',
  },
  'Manufacturing Support': {
    icon: 'fa-life-ring',
    bgClass: 'bg-amber-500/10',
    iconClass: 'text-amber-400',
  },
};
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
  const { t } = useI18n();
  const query = searchParams.get('q') || '';
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [selectedListing, setSelectedListing] = useState<StorefrontListingModalData | null>(null);
  const [isDomReady, setIsDomReady] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('companies');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(query);
  const [filters, setFilters] = useState({
    search: '',
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

  // Tab-specific filter bars to mirror dedicated pages
  const [listingsFilters, setListingsFilters] = useState({
    search: '',
    category: '',
    province: '',
  });
  const [listingsSort, setListingsSort] = useState<
    'new-to-old' | 'old-to-new' | 'price-high-low' | 'price-low-high'
  >('new-to-old');
  const [requestsFilters, setRequestsFilters] = useState({
    search: '',
    industry: '',
    province: '',
  });

  useEffect(() => {
    setIsDomReady(true);
  }, []);

  useEffect(() => {
    if (!selectedRequest && !selectedListing) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedRequest(null);
        setSelectedListing(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedRequest, selectedListing]);

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

  const filteredCompanies = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();
    return results.companies.filter((company) => {
      if (normalizedSearch) {
        const certStrings = Array.isArray(company.certifications)
          ? company.certifications.map((cert: any) =>
            typeof cert === 'string' ? cert : `${cert.code || ''} ${cert.name || ''}`
          )
          : [];
        const haystack = [
          company.name,
          company.description,
          company.location,
          company.city,
          company.province,
          company.website,
          ...(Array.isArray(company.industriesServed) ? company.industriesServed : []),
          ...(Array.isArray(company.capabilities) ? company.capabilities : []),
          ...certStrings,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(normalizedSearch)) return false;
      }

      if (filters.industry) {
        const companyIndustries = Array.isArray(company.industriesServed) ? company.industriesServed : [];
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
    const normalizedSearch = listingsFilters.search.trim().toLowerCase();
    const filtered = results.listings.filter((listing) => {
      // Category (listingType) filter
      if (listingsFilters.category) {
        if (String(listing.listingType || '') !== listingsFilters.category) return false;
      }
      // Province filter - match code or name in location/supplierProvince
      if (listingsFilters.province) {
        const targetCode = listingsFilters.province.toUpperCase();
        const targetName = PROVINCE_NAME_BY_CODE.get(targetCode) || '';
        const locationSuffix = String(listing.location || '').split(',').pop()?.trim().toUpperCase() || '';
        const supplierProvince = String(listing.supplierProvince || '').toUpperCase();
        const locationText = String(listing.location || '').toLowerCase();
        const provinceMatch =
          locationSuffix === targetCode ||
          supplierProvince === targetCode ||
          locationText.includes(targetName);
        if (!provinceMatch) return false;
      }

      // Search within several fields
      if (normalizedSearch) {
        const haystack = [
          listing.title,
          listing.description,
          listing.listingType,
          listing.supplier,
          listing.location,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(normalizedSearch)) return false;
      }
      return true;
    });

    const sorted = [...filtered];
    switch (listingsSort) {
      case 'new-to-old':
        sorted.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        break;
      case 'old-to-new':
        sorted.sort(
          (a, b) =>
            new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );
        break;
      case 'price-high-low':
        sorted.sort((a, b) => {
          const priceA = parseFloat(String(a.price || '0').replace(/[^0-9.]/g, '')) || 0;
          const priceB = parseFloat(String(b.price || '0').replace(/[^0-9.]/g, '')) || 0;
          return priceB - priceA;
        });
        break;
      case 'price-low-high':
        sorted.sort((a, b) => {
          const priceA = parseFloat(String(a.price || '0').replace(/[^0-9.]/g, '')) || 0;
          const priceB = parseFloat(String(b.price || '0').replace(/[^0-9.]/g, '')) || 0;
          return priceA - priceB;
        });
        break;
    }
    return sorted;
  }, [results.listings, listingsFilters, listingsSort]);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = requestsFilters.search.trim().toLowerCase();
    return results.requests.filter((request) => {
      // Industry (category keyword) filter
      if (requestsFilters.industry) {
        const haystack = `${request.category || ''} ${request.title || ''} ${request.description || ''}`.toLowerCase();
        if (!haystack.includes(requestsFilters.industry.toLowerCase())) return false;
      }
      // Province filter (target province / location, aligned with storefront cards)
      if (requestsFilters.province) {
        const targetCode = requestsFilters.province.toUpperCase();
        const targetName = PROVINCE_NAME_BY_CODE.get(targetCode) || '';
        const requestProvince = String(request.province || '').toUpperCase();
        const locationSuffix = String(request.location || '').split(',').pop()?.trim().toUpperCase() || '';
        const locationText = String(request.location || '').toLowerCase();
        const provinceMatch =
          requestProvince === targetCode ||
          locationSuffix === targetCode ||
          locationText.includes(targetName);
        if (!provinceMatch) return false;
      }
      // Search
      if (normalizedSearch) {
        const searchable = [
          request.title,
          request.company,
          request.category,
          request.description,
          request.quantity,
          request.location,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(normalizedSearch)) return false;
      }
      return true;
    });
  }, [results.requests, requestsFilters]);

  const filteredCounts = useMemo(
    () => ({
      companies: filteredCompanies.length,
      listings: filteredListings.length,
      requests: filteredRequests.length,
      total: filteredCompanies.length + filteredListings.length + filteredRequests.length,
    }),
    [filteredCompanies.length, filteredListings.length, filteredRequests.length]
  );

  const getIndustryLogoForCompany = (company: any) => {
    const selectedIndustries = Array.isArray(company.industriesServed)
      ? company.industriesServed.filter((industry: string) => INDUSTRY_LOGOS[industry])
      : [];

    if (selectedIndustries.length === 0) return null;
    if (selectedIndustries.length === 1) return INDUSTRY_LOGOS[selectedIndustries[0]];

    const seedString = `${company.id || company.name || ''}:${selectedIndustries.join('|')}`;
    let hash = 0;
    for (let i = 0; i < seedString.length; i += 1) {
      hash = (hash * 31 + seedString.charCodeAt(i)) >>> 0;
    }
    const selectedIndex = hash % selectedIndustries.length;
    return INDUSTRY_LOGOS[selectedIndustries[selectedIndex]];
  };

  const closeRequestModal = () => setSelectedRequest(null);

  const searchListingToModal = (listing: any): StorefrontListingModalData => ({
    profileId: String(listing.profileId || ''),
    listingType: listing.listingType,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    location: listing.location,
    supplierEmail: listing.supplierEmail ?? null,
    supplierName: listing.supplier,
    supplierLogoUrl: listing.logoUrl ?? null,
    supplierIcon: listing.selectedIcon ?? 'fa-industry',
  });

  const sourcingRequestModal =
    selectedRequest && isDomReady
      ? createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            className="absolute inset-0 bg-marcan-dark/90 backdrop-blur-sm"
            onClick={closeRequestModal}
            aria-label={t('wishlist.closeRequestDetailsAria')}
          />

          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-card rounded-3xl border border-white/10 shadow-2xl flex flex-col">
            <div className="sticky top-0 z-20 flex justify-between items-center p-6 border-b border-white/10 bg-marcan-dark/95 backdrop-blur-md">
              <div className="flex items-center gap-3 min-w-0">
                {selectedRequest.category ? (
                  <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded text-[10px] font-bold uppercase shrink-0">
                    {selectedRequest.category}
                  </span>
                ) : null}
                <h3 className="font-heading font-bold text-xl md:text-2xl text-white truncate">
                  {selectedRequest.title || t('wishlist.sourcingRequestFallback')}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeRequestModal}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all border border-white/5"
                aria-label={t('wishlist.closeRequestDetailsAria')}
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-8 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {selectedRequest.description ? (
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <i className="fa-solid fa-align-left text-orange-400"></i> {t('wishlist.requestDescription')}
                      </h4>
                      <div className="glass-card p-6 rounded-2xl border border-white/5 text-sm text-slate-300 leading-relaxed">
                        <p>{selectedRequest.description}</p>
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <i className="fa-solid fa-list-check text-orange-400"></i> {t('wishlist.sourcingRequirements')}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                          {t('wishlist.targetQuantity')}
                        </span>
                        <span className="text-sm font-semibold text-white">
                          {selectedRequest.quantity || t('wishlist.notAvailable')}
                        </span>
                      </div>
                      <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                          {t('wishlist.targetLocation')}
                        </span>
                        <span className="text-sm font-semibold text-white">
                          {selectedRequest.location || t('wishlist.notAvailable')}
                        </span>
                      </div>
                      <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                          {t('wishlist.targetPrice')}
                        </span>
                        <span className="text-sm font-semibold text-white">
                          {selectedRequest.targetPrice || t('wishlist.noneSpecified')}
                        </span>
                      </div>
                      <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                          {t('wishlist.deadline')}
                        </span>
                        <span className="text-sm font-semibold text-white">
                          {selectedRequest.deadline
                            ? new Date(selectedRequest.deadline).toLocaleDateString()
                            : t('wishlist.asap')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="glass-card p-6 rounded-2xl border border-orange-500/20 bg-gradient-to-b from-orange-500/5 to-transparent shadow-[0_0_30px_rgba(249,115,22,0.05)]">
                    <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-2">
                      {t('wishlist.interestedInRfq')}
                    </div>
                    {selectedRequest?.buyerEmail ? (
                      <a
                        href={`mailto:${selectedRequest.buyerEmail}?subject=${encodeURIComponent(
                          `RFQ: ${selectedRequest.title || ''}`
                        )}`}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                      >
                        <i className="fa-solid fa-envelope" aria-hidden />
                        {t('wishlist.emailBuyer')}
                      </a>
                    ) : (
                      <Link
                        href="/post-request"
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                      >
                        <i className="fa-solid fa-plus"></i> {t('wishlist.postRequest')}
                      </Link>
                    )}
                  </div>

                  <div className="glass-card p-6 rounded-2xl border border-white/5">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
                      {t('wishlist.postedBy')}
                    </h4>
                    <div className="text-sm font-bold text-white mb-1">
                      {selectedRequest.company || t('wishlist.companyFallback')}
                    </div>
                    <div className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase border border-blue-500/20">
                      <i className="fa-solid fa-circle-check"></i> {t('storefront.modal.platformMember')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )
      : null;

  return (
    <>
      <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
        <Header breadcrumb="Search" />

        <div className="flex-1 overflow-y-auto page-scroll relative">
          <div className="max-w-6xl mx-auto w-full min-w-0">
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

                {/* Tab-specific Filter Bars */}
                {activeTab === 'companies' && (
                  <div className="glass-card p-4 rounded-xl border border-white/5 mb-6">
                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                      <div className="w-full min-w-0 sm:flex-1 sm:min-w-[200px] relative">
                        <input
                          type="text"
                          value={filters.search}
                          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                          placeholder={t('directory.searchPlaceholder')}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 pl-10 text-sm font-semibold text-white placeholder:text-slate-500 focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <i className="fa-solid fa-magnifying-glass text-slate-400 text-sm" aria-hidden />
                        </div>
                      </div>

                      <div className="w-full sm:w-auto sm:min-w-[180px]">
                        <select
                          value={filters.industry}
                          onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all cursor-pointer"
                        >
                          <option value="">All Capabilities</option>
                          {INDUSTRY_HUBS.map((hub) => (
                            <option key={hub} value={hub}>
                              {hub}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full sm:w-auto sm:min-w-[140px]">
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

                      <div className="w-full sm:w-auto sm:min-w-[160px]">
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

                      {(filters.search.trim() || filters.industry || filters.province || filters.certification) && (
                        <button
                          type="button"
                          onClick={() =>
                            setFilters({ search: '', industry: '', province: '', certification: '' })
                          }
                          className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider transition-all hover:text-white"
                        >
                          {t('directory.clear')}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'listings' && (
                  <div className="glass-card p-4 rounded-xl border border-white/5 mb-6">
                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                      <div className="w-full min-w-0 sm:flex-1 sm:min-w-[200px] relative">
                        <input
                          type="text"
                          value={listingsFilters.search}
                          onChange={(e) => setListingsFilters({ ...listingsFilters, search: e.target.value })}
                          placeholder={t('storefront.searchListingsPlaceholder')}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 pl-10 text-sm font-semibold text-white placeholder:text-slate-500 focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <i className="fa-solid fa-magnifying-glass text-slate-400 text-sm"></i>
                        </div>
                      </div>

                      <div className="w-full sm:w-auto sm:min-w-[160px]">
                        <select
                          value={listingsSort}
                          onChange={(e) => setListingsSort(e.target.value as typeof listingsSort)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all cursor-pointer"
                        >
                          <option value="new-to-old">{t('storefront.sort.newestFirst')}</option>
                          <option value="old-to-new">{t('storefront.sort.oldestFirst')}</option>
                          <option value="price-high-low">{t('storefront.sort.priceHighToLow')}</option>
                          <option value="price-low-high">{t('storefront.sort.priceLowToHigh')}</option>
                        </select>
                      </div>
                      <div className="w-full sm:w-auto sm:min-w-[180px]">
                        <select
                          value={listingsFilters.category}
                          onChange={(e) => setListingsFilters({ ...listingsFilters, category: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all cursor-pointer"
                        >
                          <option value="">{t('storefront.allCategories')}</option>
                          {Array.from(new Set(results.listings.map((l: any) => l.listingType).filter(Boolean))).map((c: string) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-full sm:w-auto sm:min-w-[140px]">
                        <select
                          value={listingsFilters.province}
                          onChange={(e) => setListingsFilters({ ...listingsFilters, province: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all cursor-pointer"
                        >
                          <option value="">{t('storefront.allProvinces')}</option>
                          {CANADIAN_PROVINCES.map((province) => (
                            <option key={province.code} value={province.code}>
                              {province.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {(listingsFilters.search.trim() ||
                        listingsSort !== 'new-to-old' ||
                        listingsFilters.category ||
                        listingsFilters.province) && (
                          <button
                            type="button"
                            onClick={() => {
                              setListingsFilters({ search: '', category: '', province: '' });
                              setListingsSort('new-to-old');
                            }}
                            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider transition-all hover:text-white"
                          >
                            {t('storefront.clear')}
                          </button>
                        )}
                    </div>
                  </div>
                )}

                {activeTab === 'requests' && (
                  <div className="glass-card p-4 rounded-2xl flex flex-col lg:flex-row lg:flex-wrap lg:items-center gap-4 mb-6">
                    <div className="relative w-full min-w-0 lg:flex-[2] lg:min-w-[220px] lg:max-w-[520px]">
                      <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                      <input
                        type="text"
                        value={requestsFilters.search}
                        onChange={(e) => setRequestsFilters({ ...requestsFilters, search: e.target.value })}
                        placeholder="Search requests by title, category, or details..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-marcan-red outline-none transition-all placeholder:text-slate-500"
                      />
                    </div>
                    <div className="w-full sm:w-auto sm:min-w-[180px]">
                      <select
                        value={requestsFilters.industry}
                        onChange={(e) => setRequestsFilters({ ...requestsFilters, industry: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all cursor-pointer"
                      >
                        <option value="">All Capabilities</option>
                        {INDUSTRY_HUBS.map((hub) => (
                          <option key={hub} value={hub}>
                            {hub}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full sm:w-auto sm:min-w-[140px]">
                      <select
                        value={requestsFilters.province}
                        onChange={(e) => setRequestsFilters({ ...requestsFilters, province: e.target.value })}
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
                    {(requestsFilters.search || requestsFilters.industry || requestsFilters.province) && (
                      <button
                        onClick={() => setRequestsFilters({ search: '', industry: '', province: '' })}
                        className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider transition-all hover:text-white"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}

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
                              (() => {
                                const industryLogo = getIndustryLogoForCompany(company);
                                return (
                                  <Link
                                    key={company.id}
                                    href={`/profile?id=${company.id}`}
                                    className="glass-card p-6 rounded-2xl group hover:border-marcan-red/40 hover:shadow-neon transition-all duration-300 flex flex-col"
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
                                      ) : industryLogo ? (
                                        <div className={`w-12 h-12 rounded-lg ${industryLogo.bgClass} flex items-center justify-center`}>
                                          <i className={`fa-solid ${industryLogo.icon} ${industryLogo.iconClass}`}></i>
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
                                      <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                                        {company.description}
                                      </p>
                                    )}
                                    {((company.tags && company.tags.length > 0) || (company.capabilities && company.capabilities.length > 0)) && (
                                      <div className="mt-auto flex flex-wrap gap-2 mb-4">
                                        {(company.tags?.length ? company.tags : company.capabilities).slice(0, 3).map((cap: string, idx: number) => (
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
                                );
                              })()
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Listings Tab — match Industrial Storefront listing cards */}
                    {activeTab === 'listings' && (
                      <div className="space-y-4">
                        {filteredListings.length === 0 ? (
                          <div className="text-center py-12">
                            <i className="fa-solid fa-shop text-4xl text-slate-600 mb-4"></i>
                            <p className="text-slate-400">
                              {results.listings.length === 0
                                ? t('storefront.noPostings')
                                : t('storefront.noListingsMatch')}
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="mb-4 text-sm text-slate-400">
                              {t('storefront.resultsCountListings')
                                .replace('{count}', String(filteredListings.length))
                                .replace('{total}', String(results.listings.length))}
                            </div>
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

                                    <h3 className="font-heading font-bold text-white mb-1 line-clamp-1">
                                      {listing.title || t('storefront.listingCard.untitledListing')}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-3 line-clamp-1">
                                      <i className="fa-solid fa-store text-orange-400 mr-1"></i>
                                      {listing.supplier || t('storefront.modal.unknownCompany')}
                                    </p>

                                    <p className="text-xs text-slate-400 line-clamp-1 mb-4">
                                      {listing.description || t('storefront.listingCard.noDescription')}
                                    </p>

                                    <div className="mt-auto flex items-end justify-between mb-4 gap-3">
                                      <span className="text-xl font-black text-white truncate">
                                        {listing.price || t('storefront.listingCard.negotiable')}
                                      </span>
                                      <span className="text-xs text-slate-400 shrink-0">
                                        <i className="fa-solid fa-location-dot mr-1"></i>
                                        {listing.location || t('storefront.listingCard.notAvailable')}
                                      </span>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedListing(searchListingToModal(listing))}
                                        className="w-full py-2.5 rounded-lg bg-white/5 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors border border-white/5"
                                      >
                                        {t('storefront.viewListing')}
                                      </button>
                                      {listing.supplierEmail ? (
                                        <a
                                          href={`mailto:${listing.supplierEmail}?subject=${encodeURIComponent(
                                            t('storefront.modal.emailSubjectPrefix') +
                                            (listing.title || t('storefront.listingCard.untitledListing'))
                                          )}`}
                                          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all flex items-center justify-center gap-2 border border-transparent"
                                        >
                                          <i className="fa-solid fa-envelope"></i> {t('storefront.modal.emailSupplier')}
                                        </a>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Requests Tab — storefront sourcing-request card layout */}
                    {activeTab === 'requests' && (
                      <div>
                        {filteredRequests.length === 0 ? (
                          <div className="text-center py-12">
                            <i className="fa-solid fa-filter text-4xl text-slate-600 mb-4"></i>
                            <p className="text-slate-400 text-sm">
                              {results.requests.length === 0
                                ? 'No sourcing requests found.'
                                : 'No sourcing requests match your filters.'}
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="mb-4 text-sm text-slate-400">
                              {t('wishlist.resultsCount')
                                .replace('{count}', String(filteredRequests.length))
                                .replace('{total}', String(results.requests.length))}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                              {filteredRequests.map((request) => (
                                <div
                                  key={request.id}
                                  className="glass-card rounded-2xl border border-white/5 hover:border-orange-500/50 transition-all duration-300 flex flex-col group overflow-hidden"
                                >
                                  <div className="p-5 flex flex-col flex-grow">
                                    {request.category ? (
                                      <div className="mb-3">
                                        <span className="inline-flex px-2 py-1 text-[9px] font-bold uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded">
                                          {request.category}
                                        </span>
                                      </div>
                                    ) : null}

                                    <h3 className="font-heading font-bold text-white mb-1 line-clamp-1">
                                      {request.title || request.company || t('wishlist.sourcingRequestFallback')}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-3 line-clamp-1">
                                      <i className="fa-solid fa-building text-orange-400 mr-1"></i>
                                      {request.company || t('wishlist.companyFallback')}
                                    </p>

                                    <p className="text-xs text-slate-400 line-clamp-1 mb-4">
                                      {request.description || t('storefront.listingCard.noDescription')}
                                    </p>

                                    <div className="mt-auto flex items-end justify-between mb-4 gap-3">
                                      <span className="text-xl font-black text-white truncate">
                                        {request.targetPrice || t('wishlist.noneSpecified')}
                                      </span>
                                      <span className="text-xs text-slate-400 shrink-0">
                                        <i className="fa-solid fa-location-dot mr-1"></i>
                                        {request.location || t('storefront.listingCard.notAvailable')}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => setSelectedRequest(request)}
                                      className="w-full py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all flex items-center justify-center gap-2 border border-transparent"
                                    >
                                      <i className="fa-solid fa-eye"></i> View Request
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
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
      <StorefrontListingModal
        open={!!selectedListing && isDomReady}
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
      />
      {sourcingRequestModal}
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
          <Header breadcrumb="Search" />
          <div className="flex-1 overflow-y-auto page-scroll relative">
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
