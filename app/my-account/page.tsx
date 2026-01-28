'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';

export default function MyAccountPage() {
  const { isAuthenticated, user, isLoading, isMounted } = useAuth();
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
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [accountRole, setAccountRole] = useState<string>('both');
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Only check authentication after component has mounted (client-side)
    if (!isMounted) return;

    // Check authentication status - only redirect if we're sure user is not authenticated
    if (!isLoading) {
      // Double-check localStorage directly to avoid race conditions
      const authStatus = typeof window !== 'undefined' ? localStorage.getItem('marcan_auth') : null;

      if (authStatus !== 'true' && !isAuthenticated) {
        router.replace('/login');
        return;
      }
    }

    // Load user data from localStorage (saved during signup)
    if (user && isAuthenticated) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        jobTitle: user.jobTitle || '',
        email: user.email || '',
        companyName: user.companyName || '',
        businessNumber: user.businessNumber || '',
        website: user.website || '',
        aboutUs: user.aboutUs || '',
      });
      // Load capabilities and certifications
      if (user.capabilities) {
        setCapabilities(user.capabilities);
      }
      if (user.certifications) {
        setCertifications(user.certifications);
      }
      // Load account role
      if (user.role) {
        setAccountRole(user.role);
      }
    }
  }, [isAuthenticated, user, router, isLoading, isMounted]);

  const getInitials = () => {
    if (user) {
      const firstInitial = user.firstName.charAt(0).toUpperCase();
      const lastInitial = user.lastName?.charAt(0).toUpperCase() || '';
      return firstInitial + lastInitial;
    }
    return 'JS';
  };

  const handleSaveProfile = () => {
    if (!user) return;

    // Update user data in localStorage
    const updatedUser = {
      ...user,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      jobTitle: formData.jobTitle,
    };

    localStorage.setItem('marcan_user', JSON.stringify(updatedUser));
    window.dispatchEvent(new Event('marcan-auth-change'));

    setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleUpdateCompany = () => {
    if (!user) return;

    // Update user data in localStorage
    const updatedUser = {
      ...user,
      companyName: formData.companyName,
      businessNumber: formData.businessNumber,
      website: formData.website,
      aboutUs: formData.aboutUs,
      capabilities: capabilities,
      certifications: certifications,
      role: accountRole,
    };

    localStorage.setItem('marcan_user', JSON.stringify(updatedUser));
    window.dispatchEvent(new Event('marcan-auth-change'));

    setSaveMessage({ type: 'success', text: 'Company profile updated successfully!' });
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleUpdatePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSaveMessage({ type: 'error', text: 'Passwords do not match!' });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setSaveMessage({ type: 'error', text: 'Password must be at least 6 characters!' });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    // TODO: Implement actual password update logic with backend
    // For now, just show success message
    setSaveMessage({ type: 'success', text: 'Password updated successfully!' });
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setTimeout(() => setSaveMessage(null), 3000);
  };


  if (isLoading) {
    return (
      <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
        <Header breadcrumb="My Account" />
        <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
          <div className="text-slate-400">Loading...</div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="My Account" />

      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-5xl mx-auto py-6">
          {/* Save Message */}
          {saveMessage && (
            <div
              className={`mb-6 p-4 rounded-lg border ${saveMessage.type === 'success'
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
                } text-sm font-bold uppercase tracking-wider`}
            >
              {saveMessage.text}
            </div>
          )}

          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-marcan-red to-red-900 flex items-center justify-center text-2xl font-bold text-white shadow-neon">
              {getInitials()}
            </div>
            <div>
              <h2 className="font-heading text-3xl font-bold text-white">
                {user?.firstName || formData.firstName} {user?.lastName || formData.lastName}
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
                className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition ${activeTab === 'profile'
                    ? 'bg-marcan-red/10 text-white border-l-2 border-marcan-red'
                    : 'hover:bg-white/5 text-slate-400 hover:text-white'
                  }`}
              >
                Profile Settings
              </button>
              <button
                onClick={() => setActiveTab('company')}
                className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition ${activeTab === 'company'
                    ? 'bg-marcan-red/10 text-white border-l-2 border-marcan-red'
                    : 'hover:bg-white/5 text-slate-400 hover:text-white'
                  }`}
              >
                Company Profile
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition ${activeTab === 'security'
                    ? 'bg-marcan-red/10 text-white border-l-2 border-marcan-red'
                    : 'hover:bg-white/5 text-slate-400 hover:text-white'
                  }`}
              >
                Security
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
                    <button
                      onClick={handleSaveProfile}
                      className="bg-white/5 border border-white/10 text-white px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-marcan-red hover:border-marcan-red hover:shadow-neon transition-all"
                    >
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
                      {capabilities.map((item) => (
                        <span
                          key={item}
                          className="px-3 py-1 rounded bg-marcan-red text-white text-[10px] font-bold uppercase cursor-pointer hover:bg-red-600 transition"
                        >
                          {item} <i className="fa-solid fa-xmark ml-1"></i>
                        </span>
                      ))}
                      {certifications.map((item) => (
                        <span
                          key={item}
                          className="px-3 py-1 rounded bg-marcan-red text-white text-[10px] font-bold uppercase cursor-pointer hover:bg-red-600 transition"
                        >
                          {item} <i className="fa-solid fa-xmark ml-1"></i>
                        </span>
                      ))}
                      {capabilities.length === 0 && certifications.length === 0 && (
                        <span className="text-slate-500 text-xs">No capabilities or certifications added yet</span>
                      )}
                      <button className="px-3 py-1 rounded border border-white/20 text-slate-400 text-[10px] font-bold uppercase hover:text-white hover:border-white transition">
                        + Add
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-6">
                    <label className="text-[10px] font-bold text-marcan-red uppercase mb-3 block">Account Role</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="account_role"
                          value="buy"
                          checked={accountRole === 'buy'}
                          onChange={(e) => setAccountRole(e.target.value)}
                          className="rounded border-white/20 bg-black/40 text-marcan-red focus:ring-0"
                        />
                        <span className="text-sm text-slate-300 group-hover:text-white transition">Buyer Only</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="account_role"
                          value="sell"
                          checked={accountRole === 'sell'}
                          onChange={(e) => setAccountRole(e.target.value)}
                          className="rounded border-white/20 bg-black/40 text-marcan-red focus:ring-0"
                        />
                        <span className="text-sm text-slate-300 group-hover:text-white transition">Supplier Only</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="account_role"
                          value="both"
                          checked={accountRole === 'both'}
                          onChange={(e) => setAccountRole(e.target.value)}
                          className="rounded border-white/20 bg-black/40 text-marcan-red focus:ring-0"
                        />
                        <span className="text-sm text-slate-300 group-hover:text-white transition">Both (Unified)</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      onClick={handleUpdateCompany}
                      className="bg-white/5 border border-white/10 text-white px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-marcan-red hover:border-marcan-red hover:shadow-neon transition-all"
                    >
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
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Confirm Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleUpdatePassword}
                      className="bg-white/5 border border-white/10 text-white px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-marcan-red hover:border-marcan-red hover:shadow-neon transition-all"
                    >
                      Update Password
                    </button>
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
