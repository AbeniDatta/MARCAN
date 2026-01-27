'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';

export default function MyAccountPage() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    jobTitle: '',
    email: '',
    companyName: '',
    businessNumber: '',
    website: '',
    aboutUs: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Load user data (in a real app, this would come from the database)
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.firstName, // Default, would come from DB
        jobTitle: 'Procurement Manager',
        email: user.email,
        companyName: 'NorthYork Precision Ltd.',
        businessNumber: '12345 6789 RT0001',
        website: 'www.nyp-mfg.ca',
        aboutUs:
          'NorthYork Precision has been a leader in high-tolerance CNC machining for over 25 years. We specialize in complex components for the aerospace, medical, and defense sectors.',
      });
    }
  }, [isAuthenticated, user, router]);

  const getInitials = () => {
    if (user) {
      return user.firstName.charAt(0).toUpperCase() + (formData.lastName ? formData.lastName.charAt(0).toUpperCase() : 'S');
    }
    return 'JS';
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="My Account" />

      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-5xl mx-auto py-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-marcan-red to-red-900 flex items-center justify-center text-2xl font-bold text-white shadow-neon">
              {getInitials()}
            </div>
            <div>
              <h2 className="font-heading text-3xl font-bold text-white">
                {formData.firstName} {formData.lastName}
              </h2>
              <p className="text-slate-400 text-sm">
                {formData.jobTitle} at <span className="text-white font-bold">{formData.companyName}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Settings Sidebar */}
            <div className="lg:col-span-1 space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                  activeTab === 'profile'
                    ? 'bg-marcan-red/10 text-white border-l-2 border-marcan-red'
                    : 'hover:bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                Profile Settings
              </button>
              <button
                onClick={() => setActiveTab('company')}
                className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                  activeTab === 'company'
                    ? 'bg-marcan-red/10 text-white border-l-2 border-marcan-red'
                    : 'hover:bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                Company Profile
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                  activeTab === 'security'
                    ? 'bg-marcan-red/10 text-white border-l-2 border-marcan-red'
                    : 'hover:bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                Security
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                  activeTab === 'billing'
                    ? 'bg-marcan-red/10 text-white border-l-2 border-marcan-red'
                    : 'hover:bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                Billing
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 text-red-400 hover:text-red-300 transition text-xs font-bold uppercase tracking-wider mt-4"
              >
                Sign Out
              </button>
            </div>

            {/* Settings Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Profile Settings Tab */}
              {activeTab === 'profile' && (
                <div className="glass-card p-8 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                    <h3 className="font-bold text-lg text-white uppercase tracking-wide">Personal Information</h3>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Last updated: Today</span>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="text-[10px] font-bold text-marcan-red uppercase mb-2 block">First Name</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-marcan-red uppercase mb-2 block">Last Name</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="text-[10px] font-bold text-marcan-red uppercase mb-2 block">Job Title</label>
                      <input
                        type="text"
                        value={formData.jobTitle}
                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-marcan-red uppercase mb-2 block">Email Address</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button className="bg-white/5 border border-white/10 text-white px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-marcan-red hover:border-marcan-red hover:shadow-neon transition-all">
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Company Profile Tab */}
              {activeTab === 'company' && (
                <div className="glass-card p-8 rounded-2xl border border-white/5">
                  <h3 className="font-bold text-lg text-white mb-6 uppercase tracking-wide border-b border-white/5 pb-4">
                    Company Details
                  </h3>

                  <div className="mb-6 flex gap-4 items-center">
                    <div className="w-20 h-20 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-xl font-bold text-white">
                      {formData.companyName
                        .split(' ')
                        .map((word) => word[0])
                        .join('')
                        .substring(0, 3)}
                    </div>
                    <div>
                      <button className="text-xs text-marcan-red font-bold uppercase hover:text-white transition mb-1 block">
                        Change Logo
                      </button>
                      <p className="text-[10px] text-slate-500">Recommended: 400x400px PNG</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-marcan-red uppercase mb-2 block">
                        Company Legal Name
                      </label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-marcan-red uppercase mb-2 block">
                        Business Number (BN)
                      </label>
                      <input
                        type="text"
                        value={formData.businessNumber}
                        onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-marcan-red uppercase mb-2 block">Website URL</label>
                      <input
                        type="text"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="text-[10px] font-bold text-marcan-red uppercase mb-2 block">About Us</label>
                    <textarea
                      rows={4}
                      value={formData.aboutUs}
                      onChange={(e) => setFormData({ ...formData, aboutUs: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="text-[10px] font-bold text-marcan-red uppercase mb-2 block">
                      Capabilities & Certs
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Precision CNC', '5-Axis', 'ISO 9001'].map((item) => (
                        <span
                          key={item}
                          className="px-3 py-1 rounded bg-marcan-red text-white text-[10px] font-bold uppercase cursor-pointer hover:bg-red-600 transition"
                        >
                          {item} <i className="fa-solid fa-xmark ml-1"></i>
                        </span>
                      ))}
                      <button className="px-3 py-1 rounded border border-white/20 text-slate-400 text-[10px] font-bold uppercase hover:text-white hover:border-white transition">
                        + Add
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-6">
                    <label className="text-[10px] font-bold text-marcan-red uppercase mb-3 block">Account Role</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" name="account_role" className="rounded border-white/20 bg-black/40 text-marcan-red focus:ring-0" />
                        <span className="text-sm text-slate-300 group-hover:text-white transition">Buyer Only</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" name="account_role" className="rounded border-white/20 bg-black/40 text-marcan-red focus:ring-0" />
                        <span className="text-sm text-slate-300 group-hover:text-white transition">Supplier Only</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="account_role"
                          defaultChecked
                          className="rounded border-white/20 bg-black/40 text-marcan-red focus:ring-0"
                        />
                        <span className="text-sm text-slate-300 group-hover:text-white transition">Both (Unified)</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <button className="bg-white/5 border border-white/10 text-white px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-marcan-red hover:border-marcan-red hover:shadow-neon transition-all">
                      Update Company
                    </button>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="glass-card p-8 rounded-2xl border border-white/5">
                  <h3 className="font-bold text-lg text-white mb-6 uppercase tracking-wide border-b border-white/5 pb-4">
                    Security
                  </h3>
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">New Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Confirm Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button className="bg-white/5 border border-white/10 text-white px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-marcan-red hover:border-marcan-red hover:shadow-neon transition-all">
                      Update Password
                    </button>
                  </div>
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <div className="glass-card p-8 rounded-2xl border border-white/5">
                  <h3 className="font-bold text-lg text-white mb-6 uppercase tracking-wide border-b border-white/5 pb-4">
                    Billing
                  </h3>
                  <div className="text-center py-12">
                    <i className="fa-solid fa-credit-card text-4xl text-slate-600 mb-4"></i>
                    <p className="text-slate-400 text-sm">Billing information will be available soon.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
