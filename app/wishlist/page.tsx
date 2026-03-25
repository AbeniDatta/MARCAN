'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/contexts/I18nContext';

type FilterOption = 'new-to-old' | 'old-to-new' | 'price-high-low' | 'price-low-high' | 'category';
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
const PROVINCE_NAME_BY_CODE = new Map(CANADIAN_PROVINCES.map((p) => [p.code, p.name.toLowerCase()]));

export default function WishlistPage() {
  const { isAuthenticated, isMounted, user } = useAuth();
  const { t, lang } = useI18n();
  const [isSupplier, setIsSupplier] = useState(false);
  const isBuyer = !isSupplier;
  const [filter, setFilter] = useState<FilterOption>('new-to-old');
  const [requests, setRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [viewingRequest, setViewingRequest] = useState<any | null>(null);
  const [isDomReady, setIsDomReady] = useState(false);

  useEffect(() => {
    setIsDomReady(true);
  }, []);

  // Determine role from DB (source of truth): if supplier profile exists -> supplier
  useEffect(() => {
    if (!isMounted || !isAuthenticated || !user?.email) {
      setIsSupplier(false);
      return;
    }

    fetch(`/api/profiles?userId=${encodeURIComponent(user.email)}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) return null;
          throw new Error('Failed to fetch profile');
        }
        return res.json();
      })
      .then((profile) => {
        if (
          profile &&
          true
        ) {
          setIsSupplier(true);
        } else {
          setIsSupplier(false);
        }
      })
      .catch((err) => {
        console.error('Error checking supplier profile:', err);
        // Fallback to local role snapshot
        setIsSupplier(user?.role === 'supplier');
      });
  }, [isMounted, isAuthenticated, user?.email, user?.role]);

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

    if (minutes < 1) return t('wishlist.time.justNow');
    if (minutes < 60) {
      const unit = minutes === 1 ? t('wishlist.time.minute') : t('wishlist.time.minutes');
      return lang === 'fr' ? `Il y a ${minutes} ${unit}` : `${minutes} ${unit} ago`;
    }
    if (hours < 24) {
      const unit = hours === 1 ? t('wishlist.time.hour') : t('wishlist.time.hours');
      return lang === 'fr' ? `Il y a ${hours} ${unit}` : `${hours} ${unit} ago`;
    }
    {
      const unit = days === 1 ? t('wishlist.time.day') : t('wishlist.time.days');
      return lang === 'fr' ? `Il y a ${days} ${unit}` : `${days} ${unit} ago`;
    }
  };

  // Filter and sort requests (with storefront-style filters)
  const filteredRequests = useMemo(() => {
    // Text search + category + province filters
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const filtered = (requests || []).filter((r) => {
      const industryMatches =
        !selectedIndustry ||
        String(r.category || '').toLowerCase() === selectedIndustry.toLowerCase() ||
        `${r.title || ''} ${r.description || ''}`.toLowerCase().includes(selectedIndustry.toLowerCase());
      const provinceMatches = (() => {
        if (!selectedProvince) return true;
        const targetCode = selectedProvince.toUpperCase();
        const targetName = PROVINCE_NAME_BY_CODE.get(targetCode) || '';
        const requestProvinceRaw = String(r.province || '').trim();
        const requestProvinceCode = requestProvinceRaw.toUpperCase();
        const requestProvinceName = requestProvinceRaw.toLowerCase();
        const locationText = String(r.location || '').toLowerCase();
        return (
          requestProvinceCode === targetCode ||
          requestProvinceName === targetName ||
          locationText.includes(targetCode.toLowerCase()) ||
          locationText.includes(targetName)
        );
      })();

      if (!normalizedSearch) return industryMatches && provinceMatches;

      const searchable = [
        r.title,
        r.company,
        r.category,
        r.specifications,
        r.description,
        r.quantity,
        r.targetPrice,
        r.location,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return industryMatches && provinceMatches && searchable.includes(normalizedSearch);
    });

    // Sorting (same options retained)
    let sorted = [...filtered];

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
  }, [requests, filter, searchQuery, selectedIndustry, selectedProvince]);

  const requestModal = viewingRequest && isDomReady
    ? createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <button
          type="button"
              aria-label={t('wishlist.closeRequestDetailsAria')}
          onClick={() => setViewingRequest(null)}
          className="absolute inset-0 bg-marcan-dark/90 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-card rounded-3xl border border-white/10 shadow-2xl flex flex-col">
          {/* Sticky Header */}
          <div className="sticky top-0 z-20 flex justify-between items-center p-6 border-b border-white/10 bg-marcan-dark/95 backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              {viewingRequest.category && (
                <span className="bg-marcan-red/20 text-marcan-red border border-marcan-red/30 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0">
                  {viewingRequest.category}
                </span>
              )}
              <h3 className="font-heading font-bold text-xl md:text-2xl text-white truncate">
                {viewingRequest.title || t('wishlist.sourcingRequestFallback')}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setViewingRequest(null)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all border border-white/5"
              aria-label="Close request details"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 md:p-8 space-y-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-8">
                {/* Description */}
                {viewingRequest.description && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <i className="fa-solid fa-align-left text-marcan-red"></i> {t('wishlist.requestDescription')}
                    </h4>
                    <div className="glass-card p-6 rounded-2xl border border-white/5 text-sm text-slate-300 leading-relaxed">
                      <p className="mb-4 whitespace-pre-wrap">{viewingRequest.description}</p>
                    </div>
                  </div>
                )}

                {/* Specs */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-list-check text-marcan-red"></i> {t('wishlist.sourcingRequirements')}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{t('wishlist.targetQuantity')}</span>
                      <span className="text-sm font-semibold text-white">{viewingRequest.quantity || t('wishlist.notAvailable')}</span>
                    </div>
                    <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{t('wishlist.targetLocation')}</span>
                      <span className="text-sm font-semibold text-white">
                        {(viewingRequest.location && String(viewingRequest.location).trim()) ||
                          [viewingRequest.city, viewingRequest.province].filter(Boolean).join(', ') || t('wishlist.notAvailable')}
                      </span>
                    </div>
                    <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{t('wishlist.targetPrice')}</span>
                      <span className="text-sm font-semibold text-white">{viewingRequest.targetPrice || t('wishlist.noneSpecified')}</span>
                    </div>
                    <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{t('wishlist.deadline')}</span>
                      <span className="text-sm font-semibold text-white">
                        {viewingRequest.deadline ? new Date(viewingRequest.deadline).toLocaleDateString() : t('wishlist.asap')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Attachments removed per requirements */}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="glass-card p-6 rounded-2xl border border-marcan-red/20 bg-gradient-to-b from-marcan-red/5 to-transparent shadow-[0_0_30px_rgba(239,68,68,0.05)]">
                  <div className="text-[10px] font-bold text-marcan-red uppercase tracking-widest mb-4 text-center">
                    {t('wishlist.interestedInRfq')}
                  </div>
                  <button
                    type="button"
                    className="w-full py-4 rounded-xl bg-marcan-red text-white text-sm font-bold uppercase tracking-wider hover:shadow-neon hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                  >
                    <i className="fa-solid fa-envelope"></i> {t('wishlist.emailBuyer')}
                  </button>
                </div>

                <div className="glass-card p-6 rounded-2xl border border-white/5">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">{t('wishlist.postedBy')}</h4>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center font-heading font-black text-white text-xl border border-white/10 shadow-inner">
                      {(viewingRequest.initials || 'U').substring(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white mb-1">{viewingRequest.company || t('wishlist.companyFallback')}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {t('wishlist.posted')} {viewingRequest.time || t('wishlist.recentlyPosted')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Industry Category box below Posted By */}
                <div className="glass-card p-6 rounded-2xl border border-white/5">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{t('wishlist.industryCategory')}</h4>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    <i className="fa-solid fa-tags text-slate-400"></i>
                    {viewingRequest.category || t('wishlist.notAvailable')}
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
      <Header breadcrumb="Sourcing Requests" />

      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="text-marcan-red text-xs font-bold uppercase tracking-widest mb-1">{t('wishlist.explore')}</div>
            <h2 className="font-heading text-3xl font-bold text-white uppercase">{t('wishlist.title')}</h2>
          </div>
          <div className="flex flex-col items-end gap-2">
            {isMounted && isAuthenticated ? (
              <Link
                href="/post-request"
                className="bg-marcan-red text-white px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-xs hover:shadow-neon transition-all inline-flex items-center"
              >
                <i className="fa-solid fa-plus mr-2"></i> {t('wishlist.postRequest')}
              </Link>
            ) : (
              <>
                <button
                  disabled
                  className="bg-slate-600/50 text-slate-400 px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-xs cursor-not-allowed opacity-50 inline-flex items-center"
                >
                  <i className="fa-solid fa-plus mr-2"></i> {t('wishlist.postRequest')}
                </button>
                {isMounted && (
                  <p className="text-xs text-slate-500 text-right max-w-[200px]">
                    {t('wishlist.loginPrompt.prefix')}{' '}
                    <Link href="/login" className="text-marcan-red hover:text-marcan-red/80 underline">
                      {t('wishlist.loginPrompt.login')}
                    </Link>{' '}
                    {t('wishlist.loginPrompt.or')}{' '}
                    <Link href="/signup" className="text-marcan-red hover:text-marcan-red/80 underline">
                      {t('wishlist.loginPrompt.signUp')}
                    </Link>{' '}
                    {t('wishlist.loginPrompt.suffix')}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Filter Bar (mirrors Industrial Storefront stores) */}
        <div className="glass-card p-4 rounded-2xl flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-[2] min-w-[220px] max-w-[520px]">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('wishlist.searchPlaceholder')}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-marcan-red outline-none transition-all placeholder:text-slate-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all cursor-pointer"
            >
              <option value="">{t('wishlist.allIndustries')}</option>
              {INDUSTRY_HUBS.map((hub) => (
                <option key={hub} value={hub}>
                  {hub}
                </option>
              ))}
            </select>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all cursor-pointer"
            >
              <option value="">{t('wishlist.allProvinces')}</option>
              {CANADIAN_PROVINCES.map((province) => (
                <option key={province.code} value={province.code}>
                  {province.name}
                </option>
              ))}
            </select>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterOption)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all cursor-pointer"
            >
              <option value="new-to-old">{t('wishlist.sort.newestFirst')}</option>
              <option value="old-to-new">{t('wishlist.sort.oldestFirst')}</option>
              <option value="price-high-low">{t('wishlist.sort.priceHighToLow')}</option>
              <option value="price-low-high">{t('wishlist.sort.priceLowToHigh')}</option>
              <option value="category">{t('wishlist.sort.byCategory')}</option>
            </select>
          </div>
          {(searchQuery || selectedIndustry || selectedProvince) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedIndustry('');
                setSelectedProvince('');
              }}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider transition-all hover:text-white"
            >
              {t('wishlist.clear')}
            </button>
          )}
          </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-slate-400">
          {t('wishlist.resultsCount')
            .replace('{count}', String(filteredRequests.length))
            .replace('{total}', String(requests.length))}
        </div>

        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-bullhorn text-4xl text-slate-600 mb-4"></i>
            <p className="text-slate-400 text-sm">{t('wishlist.empty.noRequests')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request, index) => (
              <div
                key={index}
                className="glass-card p-6 md:p-8 rounded-2xl border border-white/5 hover:border-marcan-red/50 transition-all duration-300 relative overflow-hidden group"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-marcan-red shadow-neon opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Avatar (desktop) */}
                  <div className="hidden md:flex flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center font-heading font-black text-white text-xl shadow-lg group-hover:scale-105 transition-transform">
                      {request.initials || 'U'}
                    </div>
                  </div>

                  {/* Content */}
                <div className="flex-grow">
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-2">
                    <div>
                        <h3 className="text-white font-bold text-lg mb-1 group-hover:text-marcan-red transition-colors">
                          {request.title || request.company || t('wishlist.sourcingRequestFallback')}
                        </h3>
                        <div className="text-xs text-slate-500 font-medium">
                          {request.company ? (
                            <>
                              {t('wishlist.by')}{' '}
                              <span className="text-slate-300">{request.company}</span> • {request.time || t('wishlist.recentlyPosted')}
                            </>
                          ) : (
                            <>{request.time || t('wishlist.recentlyPosted')}</>
                          )}
                        </div>
                      </div>
                      {request.category && (
                        <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-300 shadow-sm">
                          {request.category}
                        </span>
                      )}
                    </div>

                    {request.description && (
                      <p className="text-sm text-slate-400 leading-relaxed mb-6 line-clamp-2 md:pr-24">
                        {request.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-6">
                      {request.quantity && (
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                          <div className="w-6 h-6 rounded bg-marcan-red/10 flex items-center justify-center text-marcan-red">
                            <i className="fa-solid fa-cubes"></i>
                  </div>
                      {t('wishlist.quantityLabel')} {request.quantity}
                    </div>
                  )}
                      {(request.location || request.city || request.province) && (
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                          <div className="w-6 h-6 rounded bg-marcan-red/10 flex items-center justify-center text-marcan-red">
                            <i className="fa-solid fa-location-dot"></i>
                          </div>
                          {(request.location && String(request.location).trim()) ||
                            [request.city, request.province].filter(Boolean).join(', ')}
                    </div>
                  )}
                    </div>
                </div>

                  {/* Action (right on desktop) */}
                  <div className="md:absolute md:right-8 md:top-1/2 md:-translate-y-1/2 flex items-center justify-end mt-2 md:mt-0 opacity-100 md:opacity-0 group-hover:opacity-100 md:translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                    <button
                      onClick={() => setViewingRequest(request)}
                      className="bg-marcan-red text-white px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider hover:shadow-neon transition-all flex items-center gap-2 border border-marcan-red"
                    >
                      {t('wishlist.viewDetails')} <i className="fa-solid fa-arrow-right"></i>
                  </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
      {requestModal}
    </>
  );
}



