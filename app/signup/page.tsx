'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    companyName: '',
    businessNumber: '',
    website: '',
    phone: '',
    streetAddress: '',
    city: '',
    province: '',
    aboutUs: '',
    materials: '',
    role: 'buy',
  });

  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);

  const handleCapabilityChange = (capability: string) => {
    setCapabilities((prev) =>
      prev.includes(capability) ? prev.filter((c) => c !== capability) : [...prev, capability]
    );
  };

  const handleCertificationChange = (cert: string) => {
    setCertifications((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      alert('Please fill in all required fields (First Name, Last Name, Email, Password)');
      return;
    }

    // TODO: Implement actual signup logic with backend/database
    // For now, we'll just log the user in with the provided information
    console.log('Signup attempt:', { ...formData, capabilities, certifications });

    // Log the user in with all their information
    login({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      companyName: formData.companyName,
      businessNumber: formData.businessNumber,
      website: formData.website,
      phone: formData.phone,
      streetAddress: formData.streetAddress,
      city: formData.city,
      province: formData.province,
      aboutUs: formData.aboutUs,
      materials: formData.materials,
      capabilities: capabilities,
      certifications: certifications,
      role: formData.role,
    });

    // Redirect to home page
    router.push('/');
  };

  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="Sign Up" />

      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="flex items-center justify-center min-h-screen py-10">
          <div className="glass-card p-10 rounded-3xl w-full max-w-3xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-marcan-red to-transparent shadow-neon"></div>

            <div className="text-center mb-8">
              <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">
                Create Your Account
              </h2>
              <p className="text-xs text-slate-500">Join the Canadian Manufacturing Network</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section 1: Account Credentials */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-marcan-red uppercase tracking-widest ml-1 border-b border-white/10 w-full block pb-1 mb-2">
                  1. Account Credentials
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="email"
                    placeholder="Work Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                  />
                  <input
                    type="password"
                    placeholder="Create Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Section 2: Company Details */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-marcan-red uppercase tracking-widest ml-1 border-b border-white/10 w-full block pb-1 mb-2">
                  2. Company Details
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Company Legal Name"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                  />
                  <input
                    type="text"
                    placeholder="Business Number (BN)"
                    value={formData.businessNumber}
                    onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                    className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Website URL"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                  />
                  <input
                    type="text"
                    placeholder="Main Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={formData.streetAddress}
                    onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                    className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                    />
                    <select
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className="bg-black/40 border border-white/10 rounded-lg px-2 py-3 text-sm font-semibold text-slate-400 focus:border-marcan-red focus:shadow-neon outline-none"
                    >
                      <option value="" disabled>
                        Prov.
                      </option>
                      <option value="ON">ON</option>
                      <option value="QC">QC</option>
                      <option value="BC">BC</option>
                      <option value="AB">AB</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Profile Branding */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-marcan-red uppercase tracking-widest ml-1 border-b border-white/10 w-full block pb-1 mb-2">
                  3. Profile Branding
                </label>
                <div className="flex gap-4 items-start">
                  <div className="w-24 h-24 rounded-lg bg-black/40 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500 hover:border-marcan-red/50 hover:text-marcan-red transition cursor-pointer shrink-0">
                    <i className="fa-solid fa-cloud-arrow-up text-xl mb-1"></i>
                    <span className="text-[8px] uppercase font-bold">Upload Logo</span>
                  </div>
                  <textarea
                    placeholder="About Us: Describe your company history, mission, and specialization..."
                    rows={3}
                    value={formData.aboutUs}
                    onChange={(e) => setFormData({ ...formData, aboutUs: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                  ></textarea>
                </div>
              </div>

              {/* Section 4: Capabilities & Certifications */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-marcan-red uppercase tracking-widest ml-1 border-b border-white/10 w-full block pb-1 mb-2">
                  4. Capabilities & Certs
                </label>

                {/* Core Capabilities */}
                <div className="mb-3">
                  <p className="text-xs text-slate-400 mb-2 font-bold uppercase">
                    Core Capabilities (Select all that apply)
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                    {[
                      'Precision CNC',
                      'Foundry/Cast',
                      'Finishing',
                      'Tooling',
                      'Welding',
                      'Assembly',
                      '5-Axis',
                      'Inspection',
                    ].map((cap) => (
                      <label
                        key={cap}
                        className="flex items-center gap-2 bg-black/20 p-2 rounded border border-white/5 cursor-pointer hover:border-marcan-red/30"
                      >
                        <input
                          type="checkbox"
                          checked={capabilities.includes(cap)}
                          onChange={() => handleCapabilityChange(cap)}
                          className="rounded border-white/20 bg-black/40 text-marcan-red focus:ring-0"
                        />
                        <span className="text-[10px] text-white font-bold uppercase">{cap}</span>
                      </label>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="+ Add other capabilities (e.g. 3D Printing, Laser Cutting)..."
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500 transition-all"
                  />
                </div>

                {/* Materials */}
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Materials Worked (e.g. Titanium, Inconel, Aluminum 6061...)"
                    value={formData.materials}
                    onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500"
                  />
                </div>

                {/* Certifications */}
                <div>
                  <p className="text-xs text-slate-400 mb-2 font-bold uppercase">Certifications</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                    {['ISO 9001', 'AS9100', 'CGRP', 'NADCAP'].map((cert) => (
                      <label
                        key={cert}
                        className="flex items-center gap-2 bg-black/20 p-2 rounded border border-white/5 cursor-pointer hover:border-marcan-red/30"
                      >
                        <input
                          type="checkbox"
                          checked={certifications.includes(cert)}
                          onChange={() => handleCertificationChange(cert)}
                          className="rounded border-white/20 bg-black/40 text-marcan-red focus:ring-0"
                        />
                        <span className="text-[10px] text-white font-bold uppercase">{cert}</span>
                      </label>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="+ Add other certifications..."
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-500 transition-all"
                  />
                </div>
              </div>

              {/* Section 5: Primary Intent */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-marcan-red uppercase tracking-widest ml-1 border-b border-white/10 w-full block pb-1 mb-2">
                  5. Primary Intent
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="buy"
                      checked={formData.role === 'buy'}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="peer hidden"
                    />
                    <div className="py-3 text-center border border-white/10 rounded-lg bg-black/20 text-slate-400 text-xs font-bold uppercase peer-checked:bg-marcan-red/20 peer-checked:border-marcan-red peer-checked:text-white peer-checked:shadow-neon transition-all hover:bg-white/5">
                      I want to Buy
                    </div>
                  </label>
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="sell"
                      checked={formData.role === 'sell'}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="peer hidden"
                    />
                    <div className="py-3 text-center border border-white/10 rounded-lg bg-black/20 text-slate-400 text-xs font-bold uppercase peer-checked:bg-marcan-red/20 peer-checked:border-marcan-red peer-checked:text-white peer-checked:shadow-neon transition-all hover:bg-white/5">
                      I want to Sell
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-marcan-red text-white py-4 rounded-lg font-bold text-sm uppercase tracking-widest hover:shadow-neon hover:scale-[1.02] transition-all duration-300 mt-6"
              >
                Complete Registration
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">
                Already a member?{' '}
                <Link href="/login" className="text-marcan-red font-bold hover:text-white transition-colors ml-1">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
