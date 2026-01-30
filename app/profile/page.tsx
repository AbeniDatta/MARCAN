'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

interface CompanyProfile {
  id: string;
  name: string;
  location: string;
  description: string;
  icon: string;
  tags: string[];
  userId?: string;
  logoUrl?: string;
  website?: string;
  phone?: string;
  email?: string;
  aboutUs?: string;
  capabilities?: string[];
  certifications?: string[];
  businessNumber?: string;
}

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get('id');
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (!companyId) return;

    // Load company from directory
    const directoryCompanies = JSON.parse(localStorage.getItem('marcan_directory') || '[]');
    const foundCompany = directoryCompanies.find((c: CompanyProfile) => c.id === companyId);

    if (foundCompany) {
      setCompany(foundCompany);

      // If company has userId, try to load full user data
      if (foundCompany.userId) {
        const userInfo = localStorage.getItem('marcan_user');
        if (userInfo) {
          try {
            const user = JSON.parse(userInfo);
            // Only show user data if it matches the company's userId
            if (user.email === foundCompany.userId) {
              setUserData(user);
            }
          } catch (e) {
            console.error('Error parsing user info:', e);
          }
        }
      }
    } else {
      // Fallback to default companies for demo
      const defaultCompanies: CompanyProfile[] = [
        {
          id: '1',
          name: 'NorthYork Precision Ltd.',
          location: 'Toronto, ON',
          description: 'Aerospace grade CNC machining. 5-Axis capabilities with ISO 9001 certification.',
          icon: 'fa-industry',
          tags: ['Aerospace', '5-Axis', 'CNC'],
          website: 'www.nyp-mfg.ca',
          phone: '+1 (416) 555-0199',
          email: 'quotes@nyp-mfg.ca',
          aboutUs: 'NorthYork Precision has been a leader in high-tolerance CNC machining for over 25 years. We specialize in complex components for the aerospace, medical, and defense sectors.',
          capabilities: ['5-Axis CNC Milling', 'Wire EDM', 'CMM Inspection', 'Swiss Turning'],
          certifications: ['ISO 9001:2015', 'AS9100 Rev D', 'CGRP Registered'],
        },
        {
          id: '2',
          name: 'Hamilton Castings',
          location: 'Hamilton, ON',
          description: 'Heavy industrial iron and steel casting. Custom sand molds and rapid prototyping.',
          icon: 'fa-fire-burner',
          tags: ['Foundry', 'Iron/Steel', 'Molds'],
        },
        {
          id: '3',
          name: 'WestCoast Finishers',
          location: 'Richmond, BC',
          description: 'Seeking anodizing chemicals and powder coating partners for marine applications.',
          icon: 'fa-flask',
          tags: ['Finishing', 'Anodizing', 'Chemicals'],
        },
      ];

      const defaultCompany = defaultCompanies.find((c) => c.id === companyId);
      if (defaultCompany) {
        setCompany(defaultCompany);
      }
    }
  }, [companyId]);

  if (!company) {
    return (
      <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
        <Header breadcrumb="Company Profile" />
        <div className="flex-1 overflow-y-auto p-8 relative">
          <div className="text-center py-12">
            <p className="text-slate-400">Company not found.</p>
            <Link href="/directory" className="text-marcan-red hover:text-white mt-4 inline-block">
              Back to Directory
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Get initials from company name
  const getInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Use user data if available, otherwise use company data
  const displayName = userData?.companyName || company.name;
  const displayLocation = userData ? `${userData.city || ''}, ${userData.province || ''}`.trim() : company.location;
  const displayWebsite = userData?.website || company.website;
  const displayPhone = userData?.phone || company.phone;
  const displayEmail = userData?.email || company.email;
  const displayAboutUs = userData?.aboutUs || company.aboutUs || company.description;
  const displayCapabilities = userData?.capabilities || company.capabilities || [];
  const displayCertifications = userData?.certifications || company.certifications || [];
  const displayTags = company.tags || [];
  const displayIcon = userData?.selectedIcon || company.icon || 'fa-industry';
  const displayLogoUrl = userData?.logoUrl || company.logoUrl;

  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="Company Profile" />

      <div className="flex-1 overflow-y-auto p-8 relative">
        <Link
          href="/directory"
          className="mb-6 flex items-center text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider group"
        >
          <i className="fa-solid fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i> Back to Directory
        </Link>

        <div className="glass-card rounded-3xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <i className={`fa-solid ${displayIcon} text-9xl text-slate-500`}></i>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-marcan-dark/90 to-transparent z-0"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            {displayLogoUrl ? (
              <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center overflow-hidden shadow-neon shrink-0">
                <img src={displayLogoUrl} alt={displayName} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center text-3xl font-black text-marcan-dark shadow-neon shrink-0">
                {displayLogoUrl ? (
                  <img src={displayLogoUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <i className={`fa-solid ${displayIcon} text-marcan-red`}></i>
                )}
              </div>
            )}
            <div className="flex-grow">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-heading text-3xl font-bold text-white">{displayName}</h1>
                <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                  <i className="fa-solid fa-check-circle"></i> Verified Supplier
                </span>
              </div>
              <p className="text-slate-400 text-sm mb-4 flex items-center gap-4 flex-wrap">
                {displayLocation && (
                  <span>
                    <i className="fa-solid fa-location-dot mr-1 text-marcan-red"></i> {displayLocation}
                  </span>
                )}
                {displayWebsite && (
                  <span>
                    <i className="fa-solid fa-globe mr-1 text-slate-500"></i> {displayWebsite}
                  </span>
                )}
              </p>
              {displayTags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {displayTags.map((tag) => (
                    <span key={tag} className="bg-white/5 border border-white/10 px-3 py-1 rounded text-xs text-slate-300">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* About Us */}
            {displayAboutUs && (
              <div className="glass-card p-8 rounded-2xl border border-white/5">
                <h3 className="font-bold text-lg text-white mb-4 uppercase tracking-wide border-b border-white/5 pb-2">
                  About Us
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">{displayAboutUs}</p>
              </div>
            )}

            {/* Core Capabilities */}
            {displayCapabilities.length > 0 && (
              <div className="glass-card p-8 rounded-2xl border border-white/5">
                <h3 className="font-bold text-lg text-white mb-6 uppercase tracking-wide border-b border-white/5 pb-2">
                  Core Capabilities
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayCapabilities.map((capability, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <i className="fa-solid fa-check-circle text-marcan-red mt-1"></i>
                      <div>
                        <h4 className="text-white font-bold text-sm">{capability}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            {(displayPhone || displayEmail || displayLocation) && (
              <div className="glass-card p-6 rounded-2xl border border-white/5">
                <h3 className="font-bold text-white mb-4 uppercase text-xs tracking-widest">Contact Information</h3>
                <div className="space-y-4">
                  {displayPhone && (
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-marcan-red">
                        <i className="fa-solid fa-phone"></i>
                      </div>
                      <span>{displayPhone}</span>
                    </div>
                  )}
                  {displayEmail && (
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-marcan-red">
                        <i className="fa-solid fa-envelope"></i>
                      </div>
                      <span>{displayEmail}</span>
                    </div>
                  )}
                  {displayLocation && (
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-marcan-red">
                        <i className="fa-solid fa-location-dot"></i>
                      </div>
                      <span>{displayLocation}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Certifications */}
            {displayCertifications.length > 0 && (
              <div className="glass-card p-6 rounded-2xl border border-white/5">
                <h3 className="font-bold text-white mb-4 uppercase text-xs tracking-widest">Certifications</h3>
                <div className="space-y-3">
                  {displayCertifications.map((cert, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded bg-white/5 border border-white/5">
                      <i className="fa-solid fa-certificate text-yellow-500"></i>
                      <div>
                        <div className="text-xs font-bold text-white">{cert}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
        <Header breadcrumb="Company Profile" />
        <div className="flex-1 overflow-y-auto p-8 relative">
          <div className="text-center py-12">
            <p className="text-slate-400">Loading...</p>
          </div>
        </div>
      </main>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
