'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useI18n } from '@/contexts/I18nContext';

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useI18n();

  const certifications = [
    { code: 'ISO 9001', label: 'Quality' },
    { code: 'AS9100', label: 'Aerospace' },
    { code: 'CGRP', label: 'Controlled' },
    { code: 'NADCAP', label: 'Process' },
    { code: 'ISO 14001', label: 'Environmental' },
    { code: 'ISO 45001', label: 'Safety' },
    { code: 'IATF 16949', label: 'Automotive' },
    { code: 'ISO 13485', label: 'Medical' },
  ];

  const [currentGroup, setCurrentGroup] = useState(0);
  const certificationsPerGroup = 4;
  const totalGroups = Math.ceil(certifications.length / certificationsPerGroup);

  const currentCertifications = certifications.slice(
    currentGroup * certificationsPerGroup,
    (currentGroup + 1) * certificationsPerGroup
  );

  const nextGroup = () => {
    setCurrentGroup((prev) => (prev + 1) % totalGroups);
  };

  const prevGroup = () => {
    setCurrentGroup((prev) => (prev - 1 + totalGroups) % totalGroups);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="Home" />

      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-8 relative">
        {/* Search Bar Container */}
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

        {/* Suggested AI Prompts */}
        <div className="flex items-center justify-center gap-2 mt-4 mb-6 text-[10px] sm:text-xs font-medium text-slate-400 flex-wrap">
          <span className="uppercase tracking-widest font-bold text-slate-600 mr-2">Try asking:</span>
          <button
            type="button"
            onClick={() => setSearchQuery('Aluminum anodizing in BC')}
            className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 hover:text-white transition-all"
          >
            &quot;Aluminum anodizing in BC&quot;
          </button>
          <button
            type="button"
            onClick={() => setSearchQuery('Who can cast steel parts?')}
            className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 hover:text-white transition-all"
          >
            &quot;Who can cast steel parts?&quot;
          </button>
          <button
            type="button"
            onClick={() => setSearchQuery('Find AS9100 certified suppliers')}
            className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 hover:text-white transition-all"
          >
            &quot;Find AS9100 certified suppliers&quot;
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Hero Card */}
          <div className="lg:col-span-7 glass-card rounded-3xl p-10 relative overflow-hidden group border border-white/5">
            <div className="absolute inset-0 bg-gradient-to-r from-marcan-red/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative z-10">
              <h1 className="font-heading text-5xl font-black text-white mb-4 tracking-tight leading-none uppercase">
                {t('home.hero.titleWelcome')} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-marcan-red to-orange-500 text-glow">
                  Marcan
                </span>
              </h1>
              <p className="text-slate-400 text-lg mb-8 max-w-lg font-light leading-relaxed">
                {t('home.hero.tagline')}
              </p>
              <div className="flex gap-4">
                <Link
                  href="/directory"
                  className="bg-marcan-red text-white px-8 py-3 rounded-lg font-bold uppercase tracking-wider text-sm hover:shadow-neon hover:scale-105 transition-all duration-300 inline-block"
                >
                  {t('home.hero.findManufacturers')}
                </Link>
                <Link
                  href="/signup"
                  className="border border-white/20 text-white px-8 py-3 rounded-lg font-bold uppercase tracking-wider text-sm hover:bg-white/5 hover:border-white/50 transition-all duration-300 inline-block"
                >
                  {t('home.hero.joinNetwork')}
                </Link>
              </div>
            </div>
            {/* Background graphic */}
            <i className="fa-brands fa-canadian-maple-leaf absolute -bottom-10 -right-10 text-[200px] text-white/5 rotate-[-20deg]"></i>
          </div>

          {/* Platform Workflow */}
          <div className="lg:col-span-5 glass-card rounded-3xl p-8 flex flex-col justify-center relative overflow-hidden border border-white/5 group">
            {/* Background Effect */}
            <div className="absolute -right-10 -bottom-10 text-9xl text-white/5 group-hover:text-marcan-red/10 transition-colors duration-500 pointer-events-none">
              <i className="fa-solid fa-network-wired"></i>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-5">
                <i className="fa-solid fa-route text-marcan-red"></i>
                <h3 className="text-slate-300 text-xs font-bold uppercase tracking-widest">Platform Overview</h3>
              </div>

              <h4 className="font-heading font-black text-2xl text-white mb-6">How Marcan Works</h4>

              {/* Ecosystem Timeline/Node Flow */}
              <div className="relative mt-2 space-y-7 before:absolute before:inset-y-2 before:left-[7px] before:w-[2px] before:bg-gradient-to-b before:from-blue-500 before:via-purple-500 before:to-marcan-red">

                {/* Node 1: Onboarding */}
                <div className="relative pl-8 group/node cursor-default">
                  {/* Node Dot */}
                  <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-marcan-dark border-2 border-blue-500 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.5)] z-10 group-hover/node:scale-125 transition-transform duration-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="fa-solid fa-user-plus text-blue-400 text-sm"></i>
                      <div className="text-white text-sm font-bold tracking-wide">1. Instant Onboarding</div>
                    </div>
                    <div className="text-slate-400 text-[10px] leading-relaxed">Buyers set up in seconds. Suppliers can auto-generate a full profile using our 2-minute AI website importer.</div>
                  </div>
                </div>

                {/* Node 2: Dual Action */}
                <div className="relative pl-8 group/node cursor-default">
                  <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-marcan-dark border-2 border-purple-500 flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.5)] z-10 group-hover/node:scale-125 transition-transform duration-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="fa-solid fa-arrows-split-up-and-left text-purple-400 text-sm"></i>
                      <div className="text-white text-sm font-bold tracking-wide">2. Request or List</div>
                    </div>
                    <div className="text-slate-400 text-[10px] leading-relaxed">Buyers post targeted RFQs to the network. Sellers list surplus materials, equipment, or available capacity.</div>
                  </div>
                </div>

                {/* Node 3: Collaborate */}
                <div className="relative pl-8 group/node cursor-default">
                  <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-marcan-dark border-2 border-marcan-red flex items-center justify-center shadow-neon z-10 group-hover/node:scale-125 transition-transform duration-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-marcan-red"></div>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="fa-solid fa-handshake-simple text-marcan-red text-sm"></i>
                      <div className="text-white text-sm font-bold tracking-wide">3. Match & Collaborate</div>
                    </div>
                    <div className="text-slate-400 text-[10px] leading-relaxed">Access direct contact details to make connections. Negotiate on your own terms and build long-lasting business relationships.</div>
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
                href="/directory"
                className="glass-card p-6 rounded-2xl group hover:border-marcan-red/50 hover:bg-gradient-to-b hover:from-white/5 hover:to-transparent transition-all duration-300 cursor-pointer block"
              >
                <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-microchip text-2xl"></i>
                </div>
                <h4 className="font-heading font-bold text-lg text-white mb-2">Precision Machining</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  CNC milling, turning, and EDM. High tolerance capabilities for aerospace & medical.
                </p>
                <div className="flex items-center text-[10px] font-bold text-blue-400 uppercase tracking-wider group-hover:text-white transition-colors">
                  Explore Hub <i className="fa-solid fa-arrow-right ml-2"></i>
                </div>
              </Link>

              {/* Industry Card 2 */}
              <Link
                href="/directory"
                className="glass-card p-6 rounded-2xl group hover:border-marcan-red/50 hover:bg-gradient-to-b hover:from-white/5 hover:to-transparent transition-all duration-300 cursor-pointer block"
              >
                <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-4 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-fire text-2xl"></i>
                </div>
                <h4 className="font-heading font-bold text-lg text-white mb-2">Foundries & Casting</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Sand casting, die casting, and investment casting. Iron, steel, and aluminum alloys.
                </p>
                <div className="flex items-center text-[10px] font-bold text-orange-400 uppercase tracking-wider group-hover:text-white transition-colors">
                  Explore Hub <i className="fa-solid fa-arrow-right ml-2"></i>
                </div>
              </Link>

              {/* Industry Card 3 */}
              <Link
                href="/directory"
                className="glass-card p-6 rounded-2xl group hover:border-marcan-red/50 hover:bg-gradient-to-b hover:from-white/5 hover:to-transparent transition-all duration-300 cursor-pointer block"
              >
                <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-spray-can-sparkles text-2xl"></i>
                </div>
                <h4 className="font-heading font-bold text-lg text-white mb-2">Surface Finishing</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Anodizing, powder coating, plating, and heat treatment services.
                </p>
                <div className="flex items-center text-[10px] font-bold text-purple-400 uppercase tracking-wider group-hover:text-white transition-colors">
                  Explore Hub <i className="fa-solid fa-arrow-right ml-2"></i>
                </div>
              </Link>

              {/* Industry Card 4 */}
              <Link
                href="/directory"
                className="glass-card p-6 rounded-2xl group hover:border-marcan-red/50 hover:bg-gradient-to-b hover:from-white/5 hover:to-transparent transition-all duration-300 cursor-pointer block"
              >
                <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 mb-4 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-screwdriver-wrench text-2xl"></i>
                </div>
                <h4 className="font-heading font-bold text-lg text-white mb-2">Tooling & Molds</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Injection molds, dies, and custom tooling solutions for mass production.
                </p>
                <div className="flex items-center text-[10px] font-bold text-green-400 uppercase tracking-wider group-hover:text-white transition-colors">
                  Explore Hub <i className="fa-solid fa-arrow-right ml-2"></i>
                </div>
              </Link>

              {/* Industry Card 5 */}
              <Link
                href="/directory"
                className="glass-card p-6 rounded-2xl group hover:border-marcan-red/50 hover:bg-gradient-to-b hover:from-white/5 hover:to-transparent transition-all duration-300 cursor-pointer block"
              >
                <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-robot text-2xl"></i>
                </div>
                <h4 className="font-heading font-bold text-lg text-white mb-2">Automation</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Robotics, PLC programming, and automated manufacturing systems for increased efficiency.
                </p>
                <div className="flex items-center text-[10px] font-bold text-cyan-400 uppercase tracking-wider group-hover:text-white transition-colors">
                  Explore Hub <i className="fa-solid fa-arrow-right ml-2"></i>
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
                  <i className="fa-solid fa-handshake-simple"></i>
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
            <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4 ml-1">Manufacturers</div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {['TechFab', 'MapleCNC', 'IronWorks', 'CanCast', 'PrecisionQC', 'AutoParts CA'].map((partner) => (
                <div
                  key={partner}
                  className="glass-card h-16 rounded-xl flex items-center justify-center opacity-60 hover:opacity-100 hover:border-marcan-red/30 hover:bg-white/5 transition-all duration-300 cursor-default"
                >
                  <span className="font-heading font-bold text-white text-sm tracking-wide">{partner}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
