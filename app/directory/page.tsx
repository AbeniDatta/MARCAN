'use client';

import { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { useI18n } from '@/contexts/I18nContext';
import { normalizeIndustryHubName } from '@/lib/industryHubNormalize';

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
const PROVINCE_NAME_BY_CODE = new Map(CANADIAN_PROVINCES.map((p) => [p.code, p.name.toLowerCase()]));

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

function DirectoryPageContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const hasRestoredScrollRef = useRef(false);
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [aiSearchResults, setAiSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [industryOptions, setIndustryOptions] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    industry: '',
    province: '',
    certification: '',
  });

  useEffect(() => {
    // Fetch companies from API
    const fetchCompanies = async () => {
      try {
        const response = await fetch('/api/profiles');
        if (!response.ok) {
          throw new Error('Failed to fetch companies');
        }
        const data = await response.json();
        setAllCompanies(data);
      } catch (error) {
        console.error('Error fetching companies:', error);
        setAllCompanies([]);
      }
    };

    fetchCompanies();
  }, []);

  useEffect(() => {
    const loadIndustryOptions = async () => {
      try {
        const response = await fetch('/api/capabilities?type=INDUSTRY');
        const data = response.ok ? await response.json() : [];
        const options = Array.isArray(data)
          ? data
            .map((item: any) => String(item?.name || '').trim())
            .filter((name: string) => name.length > 0)
          : [];
        setIndustryOptions(options);
      } catch {
        setIndustryOptions([]);
      }
    };

    void loadIndustryOptions();
  }, []);

  useEffect(() => {
    setFilters({
      search: (searchParams.get('search') || '').trim(),
      industry: (searchParams.get('industry') || '').trim(),
      province: (searchParams.get('province') || '').trim(),
      certification: (searchParams.get('certification') || '').trim(),
    });
  }, [searchParams]);

  useEffect(() => {
    if (hasRestoredScrollRef.current) return;

    const savedScrollTop = sessionStorage.getItem('directory-scroll-top');
    if (!savedScrollTop) return;

    const targetY = Number(savedScrollTop);
    if (!Number.isFinite(targetY)) {
      sessionStorage.removeItem('directory-scroll-top');
      return;
    }

    let cancelled = false;
    const maxAttempts = 30;

    const tryRestore = (attempt: number) => {
      if (cancelled) return;
      const container = scrollContainerRef.current;
      if (!container) {
        if (attempt < maxAttempts) {
          setTimeout(() => tryRestore(attempt + 1), 100);
        }
        return;
      }

      const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
      const nextScrollTop = Math.min(targetY, maxScroll);
      container.scrollTop = nextScrollTop;

      // Retry while async content is still affecting container height.
      if (attempt < maxAttempts && maxScroll < targetY) {
        setTimeout(() => tryRestore(attempt + 1), 100);
        return;
      }

      hasRestoredScrollRef.current = true;
      sessionStorage.removeItem('directory-scroll-top');
    };

    tryRestore(0);

    return () => {
      cancelled = true;
    };
  }, [allCompanies.length, aiSearchResults.length, isSearching]);

  // AI-powered search
  useEffect(() => {
    const performAISearch = async () => {
      if (!filters.search.trim() || filters.search.length < 2) {
        setAiSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: filters.search }),
        });

        if (response.ok) {
          const data = await response.json();
          // Use the companies from AI search results
          setAiSearchResults(data.companies || []);
        } else {
          setAiSearchResults([]);
        }
      } catch (error) {
        console.error('AI search error:', error);
        setAiSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce the search
    const timeoutId = setTimeout(performAISearch, 500);
    return () => clearTimeout(timeoutId);
  }, [filters.search]);

  // Determine which companies to use for filtering
  const companies = filters.search.trim().length >= 2 && aiSearchResults.length > 0
    ? aiSearchResults
    : allCompanies;

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      // If AI search is active, it already handles search and location filtering
      // So we only apply additional filters here

      // Industry filter
      if (filters.industry) {
        const companyIndustriesRaw = Array.isArray(company.industriesServed) && company.industriesServed.length > 0
          ? company.industriesServed
          : (Array.isArray(company.tags) ? company.tags : []);
        const normalizedIndustries = companyIndustriesRaw
          .map((hub: string) => normalizeIndustryHubName(hub))
          .filter(Boolean) as string[];
        const hasIndustry = normalizedIndustries.some(
          (hub: string) => String(hub).toLowerCase() === filters.industry.toLowerCase()
        );
        if (!hasIndustry) return false;
      }

      // Province filter
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

      // Certification filter
      if (filters.certification) {
        const companyCerts = company.certifications || [];
        const certMatches = Array.isArray(companyCerts)
          ? companyCerts.some((cert: any) => {
            if (typeof cert === 'string') {
              return cert.toLowerCase() === filters.certification.toLowerCase();
            }
            return (
              String(cert.code || '').toLowerCase() === filters.certification.toLowerCase() ||
              String(cert.name || '').toLowerCase() === filters.certification.toLowerCase()
            );
          })
          : false;
        if (!certMatches) return false;
      }

      return true;
    });
  }, [companies, filters, aiSearchResults]);

  const getIndustryLogoForCompany = (company: any) => {
    const normalizedIndustries = Array.isArray(company.industriesServed)
      ? company.industriesServed.map((industry: string) => normalizeIndustryHubName(industry)).filter(Boolean)
      : [];
    const selectedIndustries = normalizedIndustries.filter((industry: string) => INDUSTRY_LOGOS[industry]);

    if (selectedIndustries.length === 0) return null;
    if (selectedIndustries.length === 1) return INDUSTRY_LOGOS[selectedIndustries[0]];

    // Randomize logo choice across selected industries while keeping it stable per company.
    const seedString = `${company.id || company.name || ''}:${selectedIndustries.join('|')}`;
    let hash = 0;
    for (let i = 0; i < seedString.length; i += 1) {
      hash = (hash * 31 + seedString.charCodeAt(i)) >>> 0;
    }
    const selectedIndex = hash % selectedIndustries.length;
    return INDUSTRY_LOGOS[selectedIndustries[selectedIndex]];
  };

  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="Company Directory" />

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto page-scroll relative">
        <div className="mb-6">
          <div className="text-marcan-red text-xs font-bold uppercase tracking-widest mb-1">{t('directory.explore')}</div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white uppercase mb-6">{t('directory.title')}</h2>

          {/* Horizontal Filter Bar */}
          <div className="glass-card p-4 rounded-xl border border-white/5 mb-6">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
              {/* Global Search - AI Powered */}
              <div className="w-full min-w-0 sm:flex-1 sm:min-w-[200px] relative">
                <input
                  type="text"
                  placeholder={t('directory.searchPlaceholder')}
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 pl-10 text-sm font-semibold text-white placeholder:text-slate-500 focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  {isSearching ? (
                    <i className="fa-solid fa-spinner fa-spin text-slate-400 text-sm"></i>
                  ) : (
                    <i className="fa-solid fa-magnifying-glass text-slate-400 text-sm"></i>
                  )}
                </div>
                {filters.search.trim().length >= 2 && aiSearchResults.length > 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="text-xs text-marcan-red font-bold">{t('directory.aiLabel')}</span>
                  </div>
                )}
              </div>

              {/* Industry Filter */}
              <div className="min-w-[180px]">
                <select
                  value={filters.industry}
                  onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all cursor-pointer"
                >
                  <option value="">{t('directory.allIndustries')}</option>
                  {industryOptions.map((hub) => (
                    <option key={hub} value={hub}>
                      {hub}
                    </option>
                  ))}
                </select>
              </div>

              {/* Province Filter */}
              <div className="w-full sm:w-auto sm:min-w-[140px]">
                <select
                  value={filters.province}
                  onChange={(e) => setFilters({ ...filters, province: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all cursor-pointer"
                >
                  <option value="">{t('directory.allProvinces')}</option>
                  {CANADIAN_PROVINCES.map((province) => (
                    <option key={province.code} value={province.code}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Certification Filter */}
              <div className="w-full sm:w-auto sm:min-w-[160px]">
                <select
                  value={filters.certification}
                  onChange={(e) => setFilters({ ...filters, certification: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all cursor-pointer"
                >
                  <option value="">{t('directory.allCertifications')}</option>
                  {CERTIFICATIONS.map((cert) => (
                    <option key={cert.code} value={cert.code}>
                      {cert.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {(filters.search || filters.industry || filters.province || filters.certification) && (
                <button
                  onClick={() => setFilters({ search: '', industry: '', province: '', certification: '' })}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider transition-all hover:text-white"
                >
                  {t('directory.clear')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-slate-400">
          {filters.search.trim().length >= 2 && aiSearchResults.length > 0 ? (
            <>
              {t('directory.results.aiMatched').replace('{count}', String(filteredCompanies.length))}
              {filteredCompanies.length < aiSearchResults.length && (
                <span className="ml-2 text-xs">
                  {t('directory.results.filteredFrom').replace('{total}', String(aiSearchResults.length))}
                </span>
              )}
            </>
          ) : (
            <>
              {t('directory.results.ofAllCompanies')
                .replace('{count}', String(filteredCompanies.length))
                .replace('{total}', String(allCompanies.length))}
            </>
          )}
        </div>

        {companies.length === 0 ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-building text-4xl text-slate-600 mb-4"></i>
            <p className="text-slate-400 text-sm">{t('directory.empty.noCompanies')}</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-filter text-4xl text-slate-600 mb-4"></i>
            <p className="text-slate-400 text-sm">{t('directory.empty.noMatches')}</p>
            <button
              onClick={() => setFilters({ search: '', industry: '', province: '', certification: '' })}
              className="mt-4 px-4 py-2 rounded-lg bg-marcan-red text-white text-xs font-bold uppercase tracking-wider hover:shadow-neon transition-all"
            >
              {t('directory.empty.clearFilters')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              (() => {
                const industryLogo = getIndustryLogoForCompany(company);
                const cardCapabilities: string[] = [];
                const capSeen = new Set<string>();
                const rawCaps = Array.isArray(company.industriesServed) ? company.industriesServed : [];
                for (const x of rawCaps) {
                  const label = normalizeIndustryHubName(String(x)) || String(x).trim();
                  if (!label) continue;
                  const k = label.toLowerCase();
                  if (capSeen.has(k)) continue;
                  capSeen.add(k);
                  cardCapabilities.push(label);
                }
                return (
                  <div
                    key={company.id}
                    className="glass-card p-6 rounded-2xl group hover:border-marcan-red/40 hover:shadow-neon transition-all duration-300 flex flex-col w-full min-w-0 h-[26rem] overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-4 shrink-0">
                      {(company as any).logoUrl ? (
                        <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
                          <img src={(company as any).logoUrl} alt={company.name} className="w-full h-full object-cover" />
                        </div>
                      ) : industryLogo ? (
                        <div className={`w-12 h-12 rounded-lg ${industryLogo.bgClass} flex items-center justify-center`}>
                          <i className={`fa-solid ${industryLogo.icon} ${industryLogo.iconClass}`}></i>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-slate-300 group-hover:text-marcan-red transition-colors">
                          <i className={`fa-solid ${company.icon || 'fa-industry'}`}></i>
                        </div>
                      )}
                    </div>
                    <h3 className="font-heading font-bold text-lg text-white mb-1 shrink-0 line-clamp-2">{company.name}</h3>
                    <p className="text-xs text-slate-500 uppercase mb-3 shrink-0 line-clamp-2">
                      <i className="fa-solid fa-location-dot"></i> {company.location}
                    </p>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-4 overflow-hidden flex-1 min-h-0 mb-3">
                      {company.description}
                    </p>

                    <div className="mt-auto shrink-0 space-y-3 pt-1 min-h-0">
                      {/* Capabilities (Marcan hubs from profile) */}
                      {cardCapabilities.length > 0 && (
                        <div className="max-h-[5.5rem] overflow-y-auto pr-1">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">{t('directory.capabilitiesShort')}</div>
                          <div className="flex flex-wrap gap-2">
                            {cardCapabilities.map((cap: string, idx: number) => (
                              <span
                                key={`${cap}-${idx}`}
                                className="px-2 py-1 rounded bg-white/5 border border-white/10 text-slate-400 text-[10px] font-bold uppercase"
                              >
                                {cap}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <Link
                        href={`/profile?id=${company.id}&from=${encodeURIComponent(
                          `${pathname}${(() => {
                            const params = new URLSearchParams();
                            if (filters.search.trim()) params.set('search', filters.search.trim());
                            if (filters.industry.trim()) params.set('industry', filters.industry.trim());
                            if (filters.province.trim()) params.set('province', filters.province.trim());
                            if (filters.certification.trim()) params.set('certification', filters.certification.trim());
                            const query = params.toString();
                            return query ? `?${query}` : '';
                          })()}`
                        )}`}
                        onClick={() => {
                          sessionStorage.setItem(
                            'directory-scroll-top',
                            String(scrollContainerRef.current?.scrollTop || 0)
                          );
                        }}
                        className="w-full py-2 rounded bg-white/5 hover:bg-marcan-red hover:text-white hover:shadow-neon text-slate-300 text-xs font-bold uppercase tracking-wider transition-all text-center block"
                      >
                        {t('directory.viewProfile')}
                      </Link>
                    </div>
                  </div>
                );
              })()
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function DirectoryPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
          <Header breadcrumb="Company Directory" />
          <div className="flex-1 overflow-y-auto page-scroll relative">
            <div className="text-slate-400 text-sm">Loading directory...</div>
          </div>
        </main>
      }
    >
      <DirectoryPageContent />
    </Suspense>
  );
}
