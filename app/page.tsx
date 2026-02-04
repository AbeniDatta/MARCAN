'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

export default function HomePage() {
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
  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="Home" />

      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-8 relative">
        {/* Search Bar Container */}
        <div className="mb-8 w-full">
          <div className="relative group w-full">
            <div className="absolute -inset-1 bg-gradient-to-r from-marcan-red to-blue-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
            <label className="relative flex items-center justify-center bg-marcan-panel rounded-full border border-white/10 py-3 px-6 shadow-lg w-full cursor-text">
              <i className="fa-solid fa-magnifying-glass text-slate-400 text-lg mr-4"></i>
              <input
                type="text"
                placeholder="Find local partners, capabilities, or materials..."
                className="bg-transparent text-white py-1 focus:outline-none placeholder:text-slate-500 font-medium text-lg text-left w-full md:w-[500px]"
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Hero Card */}
          <div className="lg:col-span-8 glass-card rounded-3xl p-10 relative overflow-hidden group border border-white/5">
            <div className="absolute inset-0 bg-gradient-to-r from-marcan-red/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative z-10">
              <h1 className="font-heading text-5xl font-black text-white mb-4 tracking-tight leading-none uppercase">
                Welcome to <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-marcan-red to-orange-500 text-glow">
                  Marcan
                </span>
              </h1>
              <p className="text-slate-400 text-lg mb-8 max-w-lg font-light leading-relaxed">
                Sourcing local just got smarter.
                <br>
                </br>The ultimate ecosystem for Canadian Manufacturing Enterprises.
              </p>
              <div className="flex gap-4">
                <Link
                  href="/directory"
                  className="bg-marcan-red text-white px-8 py-3 rounded-lg font-bold uppercase tracking-wider text-sm hover:shadow-neon hover:scale-105 transition-all duration-300 inline-block"
                >
                  Find Manufacturers
                </Link>
                <Link
                  href="/signup"
                  className="border border-white/20 text-white px-8 py-3 rounded-lg font-bold uppercase tracking-wider text-sm hover:bg-white/5 hover:border-white/50 transition-all duration-300 inline-block"
                >
                  Join Our Network
                </Link>
              </div>
            </div>
            {/* Background graphic */}
            <i className="fa-brands fa-canadian-maple-leaf absolute -bottom-10 -right-10 text-[200px] text-white/5 rotate-[-20deg]"></i>
          </div>

          {/* Industry Spotlight */}
          <div className="lg:col-span-4 glass-card rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden border border-white/5 group">
            {/* Background Effect */}
            <div className="absolute -right-10 -top-10 text-9xl text-white/5 group-hover:text-white/10 transition-colors duration-500">
              <i className="fa-solid fa-car-side"></i>
            </div>

            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-marcan-red text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-marcan-red rounded-full shadow-neon"></span>
                  Industry Spotlight
                </h3>
                <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">
                  Automotive
                </span>
              </div>

              <h4 className="font-heading font-black text-2xl text-white mb-3">Ontario's Auto Advantage</h4>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">
                Did you know? Ontario is the only sub-national jurisdiction in North America with five major global
                automotive assemblers.
              </p>
            </div>

            <Link
              href="/directory"
              className="w-full py-3 rounded-lg bg-white/5 hover:bg-marcan-red hover:text-white hover:shadow-neon border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              Find Auto Suppliers <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>

          {/* Industry Hubs */}
          <div className="lg:col-span-12">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Industries</h3>
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

          {/* Standard Section */}
          <div className="lg:col-span-12">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Standard</h3>
              <div className="h-[1px] bg-white/10 flex-grow"></div>
            </div>
          </div>

          {/* Trust & Impact */}
          <div className="lg:col-span-6 glass-card p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent">
            <div className="flex items-center gap-3 mb-6">
              <i className="fa-solid fa-shield-halved text-marcan-red text-xl"></i>
              <h3 className="font-heading font-bold text-white uppercase text-lg">The Marcan Standard</h3>
            </div>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-marcan-red/10 flex items-center justify-center text-marcan-red border border-marcan-red/20 shrink-0">
                  <i className="fa-solid fa-map-location-dot"></i>
                </div>
                <div>
                  <div className="text-white font-bold text-sm mb-1">Local First</div>
                  <p className="text-xs text-slate-500 leading-relaxed">Proudly connecting you with partners found right here in Canada to strengthen our domestic supply chain.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shrink-0">
                  <i className="fa-solid fa-handshake-simple"></i>
                </div>
                <div>
                  <div className="text-white font-bold text-sm mb-1">Direct Contact</div>
                  <p className="text-xs text-slate-500 leading-relaxed">No middlemen fees. Connect directly with the shop floor for quotes and lead times.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Member Certifications */}
          <div className="lg:col-span-6 glass-card p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-white uppercase text-sm">Member Certifications</h3>
              {totalGroups > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevGroup}
                    className="w-6 h-6 rounded-full bg-white/5 hover:bg-marcan-red/20 border border-white/10 hover:border-marcan-red/50 flex items-center justify-center text-white hover:text-marcan-red transition-all duration-300"
                    aria-label="Previous certifications"
                  >
                    <i className="fa-solid fa-chevron-left text-xs"></i>
                  </button>
                  <button
                    onClick={nextGroup}
                    className="w-6 h-6 rounded-full bg-white/5 hover:bg-marcan-red/20 border border-white/10 hover:border-marcan-red/50 flex items-center justify-center text-white hover:text-marcan-red transition-all duration-300"
                    aria-label="Next certifications"
                  >
                    <i className="fa-solid fa-chevron-right text-xs"></i>
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">Connect with highly qualified suppliers holding top credentials.</p>

            <div className="grid grid-cols-2 gap-3">
              {currentCertifications.map((cert, index) => (
                <div
                  key={`${cert.code}-${currentGroup}`}
                  className="bg-black/20 rounded border border-white/10 p-2 text-center hover:border-marcan-red/30 transition-colors cursor-default"
                >
                  <div className="text-white font-bold text-xs">{cert.code}</div>
                  <div className="text-[8px] text-slate-500 uppercase">{cert.label}</div>
                </div>
              ))}
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
