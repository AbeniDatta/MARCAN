'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

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

export default function DirectoryPage() {
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [aiSearchResults, setAiSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    industry: '',
    province: '',
    certification: '',
    verifiedOnly: false,
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
        const companyIndustries = company.industryHubs || [];
        if (!companyIndustries.includes(filters.industry)) return false;
      }

      // Province filter (only if not using AI search, as AI handles location)
      if (filters.province && (filters.search.trim().length < 2 || aiSearchResults.length === 0)) {
        const companyProvince = company.province || '';
        if (companyProvince !== filters.province) return false;
      }

      // Certification filter
      if (filters.certification) {
        const companyCerts = company.certifications || [];
        const certMatches = Array.isArray(companyCerts)
          ? companyCerts.some((cert: any) => {
            if (typeof cert === 'string') return cert === filters.certification;
            return cert.code === filters.certification || cert.name === filters.certification;
          })
          : false;
        if (!certMatches) return false;
      }

      // Verified status filter
      if (filters.verifiedOnly && !company.verified) return false;

      return true;
    });
  }, [companies, filters, aiSearchResults]);

  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="Company Directory" />

      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="mb-6">
          <div className="text-marcan-red text-xs font-bold uppercase tracking-widest mb-1">Explore</div>
          <h2 className="font-heading text-3xl font-bold text-white uppercase mb-6">Company Directory</h2>

          {/* Horizontal Filter Bar */}
          <div className="glass-card p-4 rounded-xl border border-white/5 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              {/* Global Search - AI Powered */}
              <div className="flex-1 min-w-[200px] relative">
                <input
                  type="text"
                  placeholder="Find manufacturers, equipment, or sourcing opportunities..."
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
                    <span className="text-xs text-marcan-red font-bold">AI</span>
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
                  <option value="">All Industries</option>
                  {INDUSTRY_HUBS.map((hub) => (
                    <option key={hub} value={hub}>
                      {hub}
                    </option>
                  ))}
                </select>
              </div>

              {/* Province Filter */}
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

              {/* Certification Filter */}
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

              {/* Verified Toggle */}
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.verifiedOnly}
                    onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
                    className="w-4 h-4 rounded bg-black/40 border border-white/10 text-marcan-red focus:ring-marcan-red focus:ring-2 cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-white group-hover:text-marcan-red transition-colors">
                    Verified Only
                  </span>
                </label>
              </div>

              {/* Clear Filters */}
              {(filters.search || filters.industry || filters.province || filters.certification || filters.verifiedOnly) && (
                <button
                  onClick={() => setFilters({ search: '', industry: '', province: '', certification: '', verifiedOnly: false })}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider transition-all hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-slate-400">
          {filters.search.trim().length >= 2 && aiSearchResults.length > 0 ? (
            <>
              Showing <span className="text-white font-bold">{filteredCompanies.length}</span> AI-matched results
              {filteredCompanies.length < aiSearchResults.length && (
                <span className="ml-2 text-xs">(filtered from {aiSearchResults.length} matches)</span>
              )}
            </>
          ) : (
            <>
              Showing <span className="text-white font-bold">{filteredCompanies.length}</span> of <span className="text-white font-bold">{allCompanies.length}</span> companies
            </>
          )}
        </div>

        {companies.length === 0 ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-building text-4xl text-slate-600 mb-4"></i>
            <p className="text-slate-400 text-sm">No companies available yet.</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-filter text-4xl text-slate-600 mb-4"></i>
            <p className="text-slate-400 text-sm">No companies match your filters.</p>
            <button
              onClick={() => setFilters({ search: '', industry: '', province: '', certification: '', verifiedOnly: false })}
              className="mt-4 px-4 py-2 rounded-lg bg-marcan-red text-white text-xs font-bold uppercase tracking-wider hover:shadow-neon transition-all"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                className="glass-card p-6 rounded-2xl group hover:border-marcan-red/40 transition-all duration-300 flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  {(company as any).logoUrl ? (
                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
                      <img src={(company as any).logoUrl} alt={company.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-slate-300 group-hover:text-marcan-red transition-colors">
                      <i className={`fa-solid ${company.icon || 'fa-industry'}`}></i>
                    </div>
                  )}
                </div>
                <h3 className="font-heading font-bold text-lg text-white mb-1">{company.name}</h3>
                <p className="text-xs text-slate-500 uppercase mb-4">
                  <i className="fa-solid fa-location-dot"></i> {company.location}
                </p>
                <p className="text-slate-400 text-xs mb-6 leading-relaxed">{company.description}</p>

                {/* Industry Tags */}
                {(company.tags && company.tags.length > 0) && (
                  <div className="mt-auto flex flex-wrap gap-2 mb-4">
                    {company.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2 py-1 rounded bg-white/5 border border-white/10 text-slate-400 text-[10px] font-bold uppercase"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <Link
                  href={`/profile?id=${company.id}`}
                  className="w-full py-2 rounded bg-white/5 hover:bg-marcan-red hover:text-white hover:shadow-neon text-slate-300 text-xs font-bold uppercase tracking-wider transition-all text-center block"
                >
                  View Profile
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
