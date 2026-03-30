'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useI18n } from '@/contexts/I18nContext';

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [quickStartUrl, setQuickStartUrl] = useState('');
  const [quickStartError, setQuickStartError] = useState('');
  const [companyNames, setCompanyNames] = useState<string[]>([]);
  const [shouldScroll, setShouldScroll] = useState(false);
  const marqueeContainerRef = useRef<HTMLDivElement | null>(null);
  const marqueeTrackRef = useRef<HTMLDivElement | null>(null);
  const { t, translateText } = useI18n();

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const response = await fetch('/api/profiles');
        if (!response.ok) throw new Error('Failed to fetch company directory');
        const data = await response.json();
        const names = Array.isArray(data)
          ? data
            .map((company: any) => String(company?.name || '').trim())
            .filter((name: string) => name.length > 0)
          : [];
        setCompanyNames(names);
      } catch (error) {
        console.error('Error loading company names for homepage widget:', error);
        setCompanyNames([]);
      }
    };

    loadCompanies();
  }, []);

  // Decide whether we need to animate (only when content exceeds container)
  useEffect(() => {
    const measure = () => {
      const container = marqueeContainerRef.current;
      const track = marqueeTrackRef.current;
      if (!container || !track) {
        setShouldScroll(false);
        return;
      }
      // If a duplicated list is used, its width will be 2x. We still only care if any overflow exists.
      const hasOverflow = track.scrollWidth > container.clientWidth + 4; // small tolerance
      setShouldScroll(hasOverflow);
    };
    // Measure after layout
    const raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [companyNames]);

  const marqueeNames = useMemo(() => {
    if (companyNames.length === 0) return [];
    return shouldScroll ? [...companyNames, ...companyNames] : companyNames;
  }, [companyNames, shouldScroll]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleQuickStartImport = () => {
    const trimmedUrl = quickStartUrl.trim();
    if (!trimmedUrl) {
      setQuickStartError(t('home.quickStart.enterUrlError'));
      return;
    }
    const isValid = (() => {
      try {
        const parsed = new URL(trimmedUrl);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    })();
    if (!isValid) {
      setQuickStartError(t('home.quickStart.invalidUrlError'));
      return;
    }
    setQuickStartError('');
    router.push(`/become-supplier?start=import&url=${encodeURIComponent(trimmedUrl)}`);
  };

  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb={translateText('Home')} />

      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto page-scroll relative">
        {/* Search Bar Container */}
        <form onSubmit={handleSearch} className="mb-4 w-full max-w-6xl mx-auto">
          <div className="relative group w-full">
            {/* Enhanced AI Gradient Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-marcan-red via-orange-500 to-blue-600 rounded-2xl sm:rounded-full blur opacity-30 group-hover:opacity-60 transition duration-500"></div>

            <label className="relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 bg-marcan-panel rounded-2xl sm:rounded-full border border-white/10 p-3 sm:pl-7 sm:pr-3 shadow-lg w-full cursor-text">
              <div className="flex items-center w-full min-w-0">
                {/* AI Icon */}
                <i className="fa-solid fa-wand-magic-sparkles text-transparent bg-clip-text bg-gradient-to-r from-marcan-red to-orange-500 text-xl sm:text-2xl mr-3 sm:mr-4 shrink-0"></i>

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
                  placeholder={t('home.searchBar.placeholder')}
                  className="bg-transparent text-white py-2 sm:py-3 focus:outline-none placeholder:text-slate-500 font-medium text-base sm:text-lg md:text-xl text-left w-full min-w-0"
                />
              </div>

              {/* AI Action Button */}
              <button
                type="submit"
                className="w-full sm:w-auto sm:shrink-0 flex sm:hidden bg-white/5 hover:bg-marcan-red text-white px-6 py-3 rounded-xl sm:rounded-full font-bold text-sm uppercase tracking-wider transition-all items-center justify-center gap-2 border border-white/10 hover:border-marcan-red hover:shadow-neon"
              >
                {t('home.searchBar.askAi')} <i className="fa-solid fa-arrow-right"></i>
              </button>
              <button
                type="submit"
                className="hidden sm:flex bg-white/5 hover:bg-marcan-red text-white px-7 py-3.5 rounded-full font-bold text-sm uppercase tracking-wider transition-all ml-3 items-center gap-2 border border-white/10 hover:border-marcan-red hover:shadow-neon shrink-0"
              >
                {t('home.searchBar.askAi')} <i className="fa-solid fa-arrow-right"></i>
              </button>
            </label>
          </div>
        </form>

        {/* Suggested AI Prompts */}
        <div className="flex items-center justify-start lg:justify-center gap-1 mt-5 mb-7 text-xs sm:text-sm font-medium text-slate-400 flex-nowrap overflow-x-auto whitespace-nowrap pb-1">
          <span className="uppercase tracking-widest font-bold text-slate-600 mr-2 shrink-0">{t('home.searchBar.tryAsking')}</span>
          <button
            type="button"
            onClick={() => setSearchQuery(t('home.searchBar.prompt1'))}
            className="px-5 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 hover:text-white transition-all shrink-0"
          >
            &quot;{t('home.searchBar.prompt1')}&quot;
          </button>
          <button
            type="button"
            onClick={() => setSearchQuery(t('home.searchBar.prompt2'))}
            className="px-5 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 hover:text-white transition-all shrink-0"
          >
            &quot;{t('home.searchBar.prompt2')}&quot;
          </button>
          <button
            type="button"
            onClick={() => setSearchQuery(t('home.searchBar.prompt3'))}
            className="px-5 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 hover:text-white transition-all shrink-0"
          >
            &quot;{t('home.searchBar.prompt3')}&quot;
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 w-full min-w-0">
          {/* Main Hero Card */}
          <div className="lg:col-span-7 glass-card rounded-3xl p-6 sm:p-8 md:p-10 relative overflow-hidden group border border-white/5 min-h-[min(420px,70vh)] sm:min-h-[420px] flex items-center">
            <div className="absolute inset-0 bg-gradient-to-r from-marcan-red/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative z-10">
              <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 sm:mb-6 tracking-tight leading-[1.05] sm:leading-none uppercase">
                {t('home.hero.titleWelcome')} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-marcan-red to-orange-500 text-glow">
                  Marcan
                </span>
              </h1>
              <p className="text-slate-300 text-base sm:text-lg md:text-xl mb-8 sm:mb-10 max-w-2xl font-light leading-relaxed">
                {t('home.hero.tagline')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/directory"
                  className="bg-marcan-red text-white px-7 py-4 rounded-lg font-bold uppercase tracking-wider text-base hover:shadow-neon hover:scale-105 transition-all duration-300 inline-block"
                >
                  {t('home.hero.findManufacturers')}
                </Link>
                <Link
                  href="/signup"
                  className="border border-white/20 text-white px-7 py-4 rounded-lg font-bold uppercase tracking-wider text-base hover:bg-white/5 hover:border-white/50 transition-all duration-300 inline-block"
                >
                  {t('home.hero.joinNetwork')}
                </Link>
              </div>

            </div>
            {/* Background graphic */}
            <i className="fa-brands fa-canadian-maple-leaf absolute -bottom-10 -right-10 text-[120px] sm:text-[160px] md:text-[200px] text-white/5 rotate-[-20deg] pointer-events-none"></i>
          </div>

          {/* AI Scraper Spotlight */}
          <div className="lg:col-span-5 glass-card rounded-3xl p-3 sm:p-4 flex flex-col justify-center relative overflow-hidden border border-white/5 group min-h-[min(380px,65vh)] sm:min-h-[420px]">
            {/* Background Effect */}
            <div className="absolute -right-10 -bottom-10 text-9xl text-white/5 group-hover:text-marcan-red/10 transition-colors duration-500 pointer-events-none">
              <i className="fa-solid fa-network-wired"></i>
            </div>

            <div className="relative z-10">
              {/* AI website scraper quick start (URL -> auto-import supplier profile) */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0a1024]/90 to-[#040816]/95 border-2 border-orange-500/40 backdrop-blur-md relative overflow-hidden group/ai shadow-[0_0_50px_rgba(249,115,22,0.12)]">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-marcan-red/10 opacity-70 group-hover/ai:opacity-100 transition-opacity duration-500" />
                <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-marcan-red/10 blur-3xl pointer-events-none" />
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4 bg-orange-500/10 border border-orange-500/30 text-orange-300 text-[10px] font-bold uppercase tracking-widest">
                    <i className="fa-solid fa-bolt" />
                    {t('home.quickStart.badge')}
                  </div>
                  <h3 className="font-heading font-black text-3xl leading-[1.05] uppercase mb-3">
                    <span className="text-white">{t('home.quickStart.titleBefore')}</span>
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-marcan-red">
                      {t('home.quickStart.titleHighlight')}
                    </span>
                  </h3>
                  <p className="text-sm text-slate-300 mb-5 leading-relaxed">{t('home.quickStart.body')}</p>

                  <div className="flex flex-col gap-3">
                    <div className="relative flex-grow">
                      <i className="fa-solid fa-link absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                      <input
                        type="url"
                        value={quickStartUrl}
                        onChange={(e) => {
                          const v = e.target.value;
                          setQuickStartUrl(v);
                          if (!v.trim()) {
                            setQuickStartError('');
                            return;
                          }
                          try {
                            const u = new URL(v.trim());
                            const ok = u.protocol === 'http:' || u.protocol === 'https:';
                            setQuickStartError(ok ? '' : t('home.quickStart.invalidUrlError'));
                          } catch {
                            setQuickStartError(t('home.quickStart.invalidUrlError'));
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleQuickStartImport();
                          }
                        }}
                        placeholder={t('home.quickStart.urlPlaceholder')}
                        className={`w-full bg-black/70 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 border ${quickStartError ? 'border-red-500/40 focus:border-red-500' : 'border-white/10 focus:border-orange-500'
                          }`}
                      />

                      {quickStartError && (
                        <div className="mt-2 text-[11px] text-red-400">{quickStartError}</div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleQuickStartImport}
                      disabled={!quickStartUrl.trim() || !!quickStartError}
                      className="w-full bg-gradient-to-r from-orange-500 to-marcan-red text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <i className="fa-solid fa-wand-magic-sparkles" />
                      {t('home.quickStart.autoGenerate')}
                    </button>
                  </div>

                  <div className="mt-4 text-[11px] text-slate-400 font-semibold tracking-wide uppercase flex items-center gap-2">
                    <i className="fa-solid fa-shield-halved text-slate-500" />
                    {t('home.quickStart.freeToJoin')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Industry Hubs */}
          <div className="lg:col-span-12">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('home.industriesTitle')}</h3>
              <div className="h-[1px] bg-white/10 flex-grow"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Industry Card 1 */}
              <Link
                href={`/directory?industry=${encodeURIComponent('Precision Machining')}`}
                className="glass-card p-6 rounded-2xl group hover:border-marcan-red/50 hover:bg-gradient-to-b hover:from-white/5 hover:to-transparent transition-all duration-300 cursor-pointer block"
              >
                <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-microchip text-2xl"></i>
                </div>
                <h4 className="font-heading font-bold text-lg text-white mb-2">{t('home.industries.precisionMachining')}</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{t('home.industries.precisionMachiningDescription')}</p>
                <div className="flex items-center text-[10px] font-bold text-blue-400 uppercase tracking-wider group-hover:text-white transition-colors">
                  {t('home.industries.exploreIndustry')} <i className="fa-solid fa-arrow-right ml-2"></i>
                </div>
              </Link>

              {/* Industry Card 2 */}
              <Link
                href={`/directory?industry=${encodeURIComponent('Foundries & Casting')}`}
                className="glass-card p-6 rounded-2xl group hover:border-marcan-red/50 hover:bg-gradient-to-b hover:from-white/5 hover:to-transparent transition-all duration-300 cursor-pointer block"
              >
                <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-4 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-fire text-2xl"></i>
                </div>
                <h4 className="font-heading font-bold text-lg text-white mb-2">{t('home.industries.foundriesCasting')}</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{t('home.industries.foundriesCastingDescription')}</p>
                <div className="flex items-center text-[10px] font-bold text-orange-400 uppercase tracking-wider group-hover:text-white transition-colors">
                  {t('home.industries.exploreIndustry')} <i className="fa-solid fa-arrow-right ml-2"></i>
                </div>
              </Link>

              {/* Industry Card 3 */}
              <Link
                href={`/directory?industry=${encodeURIComponent('Surface Finishing')}`}
                className="glass-card p-6 rounded-2xl group hover:border-marcan-red/50 hover:bg-gradient-to-b hover:from-white/5 hover:to-transparent transition-all duration-300 cursor-pointer block"
              >
                <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-spray-can-sparkles text-2xl"></i>
                </div>
                <h4 className="font-heading font-bold text-lg text-white mb-2">{t('home.industries.surfaceFinishing')}</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{t('home.industries.surfaceFinishingDescription')}</p>
                <div className="flex items-center text-[10px] font-bold text-purple-400 uppercase tracking-wider group-hover:text-white transition-colors">
                  {t('home.industries.exploreIndustry')} <i className="fa-solid fa-arrow-right ml-2"></i>
                </div>
              </Link>

              {/* Industry Card 4 */}
              <Link
                href={`/directory?industry=${encodeURIComponent('Tooling & Molds')}`}
                className="glass-card p-6 rounded-2xl group hover:border-marcan-red/50 hover:bg-gradient-to-b hover:from-white/5 hover:to-transparent transition-all duration-300 cursor-pointer block"
              >
                <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 mb-4 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-screwdriver-wrench text-2xl"></i>
                </div>
                <h4 className="font-heading font-bold text-lg text-white mb-2">{t('home.industries.toolingMolds')}</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{t('home.industries.toolingMoldsDescription')}</p>
                <div className="flex items-center text-[10px] font-bold text-green-400 uppercase tracking-wider group-hover:text-white transition-colors">
                  {t('home.industries.exploreIndustry')} <i className="fa-solid fa-arrow-right ml-2"></i>
                </div>
              </Link>

              {/* Industry Card 5 */}
              <Link
                href={`/directory?industry=${encodeURIComponent('Automation')}`}
                className="glass-card p-6 rounded-2xl group hover:border-marcan-red/50 hover:bg-gradient-to-b hover:from-white/5 hover:to-transparent transition-all duration-300 cursor-pointer block"
              >
                <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-robot text-2xl"></i>
                </div>
                <h4 className="font-heading font-bold text-lg text-white mb-2">{t('home.industries.automation')}</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{t('home.industries.automationDescription')}</p>
                <div className="flex items-center text-[10px] font-bold text-cyan-400 uppercase tracking-wider group-hover:text-white transition-colors">
                  {t('home.industries.exploreIndustry')} <i className="fa-solid fa-arrow-right ml-2"></i>
                </div>
              </Link>
            </div>
          </div>


          {/* Trust & Impact */}
          <div className="lg:col-span-12 glass-card p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent">
            <div className="flex items-center gap-3 mb-6">
              <i className="fa-solid fa-shield-halved text-marcan-red text-xl"></i>
              <h3 className="font-heading font-bold text-white uppercase text-lg">{t('home.marcanStandardTitle')}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shrink-0">
                  <i className="fa-solid fa-bolt"></i>
                </div>
                <div>
                  <div className="text-white font-bold text-sm mb-1">{t('home.marcanStandard.aiSetupTitle')}</div>
                  <p className="text-xs text-slate-500 leading-relaxed">{t('home.marcanStandard.aiSetupBody')}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-marcan-red/10 flex items-center justify-center text-marcan-red border border-marcan-red/20 shrink-0">
                  <i className="fa-solid fa-map-location-dot"></i>
                </div>
                <div>
                  <div className="text-white font-bold text-sm mb-1">{t('home.marcanStandard.localFirstTitle')}</div>
                  <p className="text-xs text-slate-500 leading-relaxed">{t('home.marcanStandard.localFirstBody')}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shrink-0">
                  <i className="fa-solid fa-people-arrows"></i>
                </div>
                <div>
                  <div className="text-white font-bold text-sm mb-1">{t('home.marcanStandard.directContactTitle')}</div>
                  <p className="text-xs text-slate-500 leading-relaxed">{t('home.marcanStandard.directContactBody')}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 shrink-0">
                  <i className="fa-solid fa-circle-check"></i>
                </div>
                <div>
                  <div className="text-white font-bold text-sm mb-1">{t('home.marcanStandard.freeTitle')}</div>
                  <p className="text-xs text-slate-500 leading-relaxed">{t('home.marcanStandard.freeBody')}</p>
                </div>
              </div>
            </div>
          </div>







          {/* Trusted Partners Section */}
          <div className="lg:col-span-12">
            <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4 ml-1">{t('home.manufacturersSectionTitle')}</div>
            <div className="glass-card rounded-2xl border border-white/5 p-4 overflow-hidden">
              {marqueeNames.length === 0 ? (
                <div className="h-16 flex items-center justify-center text-sm text-slate-500">
                  {t('home.emptyManufacturers')}
                </div>
              ) : (
                <div className="manufacturer-marquee" ref={marqueeContainerRef}>
                  <div
                    className={`manufacturer-track${shouldScroll ? ' animate' : ''}`}
                    ref={marqueeTrackRef}
                  >
                    {marqueeNames.map((name, index) => (
                      <div
                        key={`${name}-${index}`}
                        className="h-14 px-6 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center shrink-0"
                      >
                        <span className="font-heading font-bold text-white text-sm tracking-wide whitespace-nowrap">
                          {name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .manufacturer-marquee {
          overflow: hidden;
          width: 100%;
        }

        .manufacturer-track {
          display: flex;
          gap: 0.75rem;
          width: max-content;
          /* No animation by default; enabled only when overflow is present */
          animation: none;
        }
        .manufacturer-track.animate {
          animation: manufacturer-scroll 700s linear infinite;
        }

        @keyframes manufacturer-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </main>
  );
}
