'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';

export default function MyAccountPage() {
  const { isAuthenticated, user, isLoading, isMounted, login } = useAuth();
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
  const [supplierProfile, setSupplierProfile] = useState<any | null>(null);
  const [accountRole, setAccountRole] = useState<string>('both');
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [myWishlistRequests, setMyWishlistRequests] = useState<any[]>([]);
  const [mySupplierListings, setMySupplierListings] = useState<any[]>([]);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);
  const [error, setError] = useState('');

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
      // Load capabilities and certifications from local user snapshot if present
      if (user.capabilities) {
        setCapabilities(user.capabilities);
      }
      if (user.certifications) {
        setCertifications(user.certifications);
      }
      // Load account role from auth user; role is managed by signup / become-seller flows only
      if (user.role) {
        setAccountRole(user.role);
      }

      // Load user's wishlist requests, listings, and rich supplier profile from API
      if (typeof window !== 'undefined' && user.email) {
        // Fetch the supplier profile for this user (if it exists)
        fetch(`/api/profiles?userId=${encodeURIComponent(user.email)}`)
          .then((res) => {
            if (!res.ok) {
              if (res.status === 404) {
                return null;
              }
              throw new Error('Failed to fetch supplier profile');
            }
            return res.json();
          })
          .then((profile) => {
            if (!profile) {
              setSupplierProfile(null);
              return;
            }

            setSupplierProfile(profile);

            // If the profile indicates seller intent, reflect that in read-only accountRole state
            if (profile.primaryIntent === 'sell' || profile.primaryIntent === 'both') {
              const newRole = profile.primaryIntent === 'both' ? 'both' : 'sell';
              setAccountRole(newRole);
            }

            // Hydrate company-related fields in the form for convenience
            setFormData((prev) => ({
              ...prev,
              companyName: profile.companyName || prev.companyName,
              jobTitle: profile.jobTitle || prev.jobTitle,
              businessNumber: profile.businessNumber || prev.businessNumber,
              website: profile.website || prev.website,
              aboutUs: profile.aboutUs || prev.aboutUs,
            }));

            // Prefer capabilities / certifications from the supplier profile if present
            if (Array.isArray(profile.capabilities) && profile.capabilities.length > 0) {
              setCapabilities(profile.capabilities);
            }
            if (Array.isArray(profile.certifications) && profile.certifications.length > 0) {
              setCertifications(profile.certifications);
            }
          })
          .catch((err) => {
            console.error('Error fetching user profile:', err);
          });

        // Fetch user's own wishlist requests
        fetch(`/api/wishlist/my?userId=${encodeURIComponent(user.email)}`)
          .then((res) => {
            if (!res.ok) {
              throw new Error('Failed to fetch wishlist requests');
            }
            return res.json();
          })
          .then((userRequests) => {
            // Ensure it's an array
            if (Array.isArray(userRequests)) {
              setMyWishlistRequests(userRequests);
            } else {
              console.error('Invalid response format:', userRequests);
              setMyWishlistRequests([]);
            }
          })
          .catch((err) => {
            console.error('Error fetching wishlist requests:', err);
            setMyWishlistRequests([]);
          });

        // Fetch user's own supplier listings (check if user has seller profile)
        fetch(`/api/listings/my?userId=${encodeURIComponent(user.email)}`)
          .then((res) => {
            if (!res.ok) {
              throw new Error('Failed to fetch listings');
            }
            return res.json();
          })
          .then((userListings) => {
            // Ensure it's an array
            if (Array.isArray(userListings)) {
              setMySupplierListings(userListings);
            } else {
              console.error('Invalid response format:', userListings);
              setMySupplierListings([]);
            }
          })
          .catch((err) => {
            console.error('Error fetching listings:', err);
            setMySupplierListings([]);
          });
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
      // Role is not updated here - it's set during signup/become-seller
    };

    localStorage.setItem('marcan_user', JSON.stringify(updatedUser));
    window.dispatchEvent(new Event('marcan-auth-change'));

    setSaveMessage({ type: 'success', text: 'Company profile updated successfully!' });
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleDeleteWishlistRequest = async (requestId: string) => {
    if (!user?.email) return;

    try {
      const response = await fetch(`/api/wishlist/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete request');
      }

      // Update state by removing the deleted request
      setMyWishlistRequests((prev) => prev.filter((req) => req.id !== requestId));

      setSaveMessage({ type: 'success', text: 'Wishlist request deleted successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      console.error('Error deleting wishlist request:', error);
      setSaveMessage({ type: 'error', text: error.message || 'Failed to delete request' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleDeleteSupplierListing = async (listingId: string) => {
    if (!user?.email) return;

    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete listing');
      }

      // Update state by removing the deleted listing
      setMySupplierListings((prev) => prev.filter((listing) => listing.id !== listingId));

      setSaveMessage({ type: 'success', text: 'Supplier listing deleted successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      console.error('Error deleting listing:', error);
      setSaveMessage({ type: 'error', text: error.message || 'Failed to delete listing' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleDeleteSellerProfile = async () => {
    if (!user) return;

    setIsDeletingProfile(true);
    setError('');

    try {
      // Delete profile from database (this will cascade delete listings and wishlist requests)
      const response = await fetch(`/api/profiles/${encodeURIComponent(user.email)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to delete seller profile');
      }

      const result = await response.json();
      console.log('Profile deleted:', result);

      // Remove all seller-related data from user profile
      const updatedUser = {
        ...user,
        // Remove seller-specific fields
        jobTitle: undefined,
        companyName: undefined,
        businessNumber: undefined,
        website: undefined,
        aboutUs: undefined,
        capabilities: undefined,
        certifications: undefined,
        selectedIcon: undefined,
        logoUrl: undefined,
        // Change role back to 'buy'
        role: 'buy',
      };

      // Clean up undefined fields
      Object.keys(updatedUser).forEach((key) => {
        if ((updatedUser as any)[key] === undefined) {
          delete (updatedUser as any)[key];
        }
      });

      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('marcan_user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('marcan-auth-change'));
      }

      // Update auth state
      login(updatedUser);

      // Update local state
      setFormData({
        firstName: updatedUser.firstName || '',
        lastName: updatedUser.lastName || '',
        jobTitle: '',
        email: updatedUser.email || '',
        companyName: '',
        businessNumber: '',
        website: '',
        aboutUs: '',
      });
      setCapabilities([]);
      setCertifications([]);
      setAccountRole('buy');

      setShowDeleteConfirm(false);
      setSaveMessage({
        type: 'success',
        text: `Seller profile deleted successfully. Removed ${result.deletedListings || 0} listing(s) from marketplace and company from directory. Your account is now a buyer account.`
      });
      setTimeout(() => setSaveMessage(null), 5000);

      // Refresh the page to update the UI (remove Company Profile tab)
      // This also refreshes the directory and marketplace pages if they're open
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error('Error deleting seller profile:', err);
      setError(err.message || 'Failed to delete seller profile');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeletingProfile(false);
    }
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

          {/* Profile Header Banner */}
          <div className="glass-card rounded-3xl p-8 mb-8 flex items-center gap-6 relative overflow-hidden border border-white/5">
            <div className="absolute right-0 top-0 w-64 h-64 bg-marcan-red/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-marcan-red to-red-900 flex items-center justify-center text-3xl font-black text-white shadow-neon shrink-0 z-10">
              {getInitials()}
            </div>
            <div className="z-10">
              <h2 className="font-heading text-3xl font-black text-white tracking-wide mb-1">
                {user?.firstName || formData.firstName} {user?.lastName || formData.lastName}
              </h2>
              <p className="text-slate-400 text-sm flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold uppercase tracking-wider text-white">
                  Verified Account
                </span>
                {formData.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Settings Sidebar Tabs */}
            <div className="lg:col-span-3 space-y-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`account-nav-btn w-full text-left px-5 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider border-l-4 transition-all ${activeTab === 'profile'
                  ? 'bg-marcan-red/10 text-white border-marcan-red'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                  }`}
              >
                Profile Settings
              </button>
              {/* Only show Supplier Company Profile tab if user is a seller */}
              {(user?.role === 'both' || user?.role === 'sell' || accountRole === 'both' || accountRole === 'sell') && (
                <button
                  onClick={() => setActiveTab('company')}
                  className={`account-nav-btn w-full text-left px-5 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider border-l-4 transition-all ${activeTab === 'company'
                    ? 'bg-marcan-red/10 text-white border-marcan-red'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                    }`}
                >
                  Supplier Company Profile
                </button>
              )}
              <button
                onClick={() => setActiveTab('my-posts')}
                className={`account-nav-btn w-full text-left px-5 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider border-l-4 transition-all ${activeTab === 'my-posts'
                  ? 'bg-marcan-red/10 text-white border-marcan-red'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                  }`}
              >
                My Posts
              </button>
            </div>

            {/* Settings Content Area */}
            <div className="lg:col-span-9 relative min-h-[500px]">
              {/* TAB: Personal Information */}
              {activeTab === 'profile' && (
                <div className="account-tab block animate-fade-in">
                  <div className="glass-card p-8 rounded-3xl border border-white/5">
                    <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                      <h3 className="font-heading font-black text-xl text-white uppercase tracking-wide">
                        Personal Information
                      </h3>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Last updated: Today</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                          Your Job Title
                        </label>
                        <input
                          type="text"
                          value={formData.jobTitle}
                          onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveProfile}
                        className="bg-white/5 border border-white/10 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-marcan-red hover:border-marcan-red hover:shadow-neon transition-all"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Supplier Company Profile Tab */}
              {activeTab === 'company' && (
                <div className="account-tab block animate-fade-in">
                  <div className="glass-card p-8 rounded-3xl border border-white/5">
                    <div className="mb-8 border-b border-white/5 pb-4">
                      <h3 className="font-heading font-black text-xl text-white uppercase tracking-wide">
                        Supplier Company Details
                      </h3>
                    </div>

                    {/* Logo / Avatar area */}
                    <div className="mb-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center p-6 bg-black/20 rounded-2xl border border-white/5">
                      <div className="w-24 h-24 rounded-xl bg-black/60 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500">
                        <span className="text-xl font-bold text-white">
                          {(formData.companyName || supplierProfile?.companyName || 'M')
                            .split(' ')
                            .map((w: string) => w[0])
                            .join('')
                            .substring(0, 3)
                            .toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm mb-1 uppercase">Company Logo</h4>
                        <p className="text-xs text-slate-500 mb-3">
                          Recommended: 400x400px transparent PNG.
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                          Logo upload coming soon
                        </p>
                      </div>
                    </div>

                    {/* Core company fields (name / BN / website) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                          Company Legal Name
                        </label>
                        <input
                          type="text"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all placeholder:text-slate-600"
                          placeholder="Enter company name"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                          Business Number (BN)
                        </label>
                        <input
                          type="text"
                          value={formData.businessNumber}
                          onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all placeholder:text-slate-600"
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                          Website URL
                        </label>
                        <input
                          type="text"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all placeholder:text-slate-600"
                          placeholder="www.example.com"
                        />
                      </div>
                    </div>

                    {/* Location & logistics from supplier profile */}
                    {supplierProfile && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                            Location
                          </label>
                          <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                            {(supplierProfile.city || '') && (supplierProfile.province || '')
                              ? `${supplierProfile.city}, ${supplierProfile.province}`
                              : supplierProfile.city || supplierProfile.province || 'Not specified'}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                            Provinces Served
                          </label>
                          <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                            {Array.isArray(supplierProfile.provincesServed) && supplierProfile.provincesServed.length > 0
                              ? supplierProfile.provincesServed.join(', ')
                              : 'Not specified'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* About Us */}
                    <div className="mb-8">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                        About Us
                      </label>
                      <textarea
                        rows={4}
                        value={formData.aboutUs}
                        onChange={(e) => setFormData({ ...formData, aboutUs: e.target.value })}
                        placeholder="Describe your company's mission, history, and core focus..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all placeholder:text-slate-600"
                      />
                    </div>

                    {/* Capabilities & Certifications from profile */}
                    <div className="mb-8">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                        Capabilities & Certs
                      </label>
                      <div className="p-4 rounded-xl border border-white/5 bg-black/20 flex flex-wrap gap-2 items-center min-h-[60px]">
                        {capabilities.map((item) => (
                          <span
                            key={item}
                            className="px-3 py-1.5 rounded-lg bg-marcan-red text-white text-[10px] font-bold uppercase tracking-wider"
                          >
                            {item}
                          </span>
                        ))}
                        {certifications.map((item) => (
                          <span
                            key={item}
                            className="px-3 py-1.5 rounded-lg bg-white/10 text-slate-200 text-[10px] font-bold uppercase tracking-wider border border-white/10"
                          >
                            {item}
                          </span>
                        ))}
                        {capabilities.length === 0 && certifications.length === 0 && (
                          <span className="text-xs text-slate-500 italic">
                            No capabilities or certifications added yet.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contact details from supplier profile */}
                    {supplierProfile && (
                      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                            RFQ Email
                          </label>
                          <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                            {supplierProfile.rfqEmail || 'Not specified'}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                            Phone Number
                          </label>
                          <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                            {supplierProfile.phone || 'Not specified'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Account Role - read only */}
                    <div className="mb-8 p-5 rounded-xl border border-white/5 bg-black/20 flex justify-between items-center">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
                          Account Role
                        </label>
                        <div className="text-white font-bold text-sm">
                          {accountRole === 'buy' && 'Buyer Only'}
                          {accountRole === 'sell' && 'Supplier Only'}
                          {accountRole === 'both' && 'Buyer and Supplier'}
                        </div>
                      </div>
                      {/* Role is intentionally read-only – no change role button */}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-marcan-red text-xs font-bold uppercase tracking-wider hover:text-red-400 transition-colors flex items-center gap-2"
                      >
                        <i className="fa-solid fa-trash-can"></i> Delete Profile
                      </button>
                      <button
                        onClick={handleUpdateCompany}
                        className="bg-white/5 border border-white/10 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-marcan-red hover:border-marcan-red hover:shadow-neon transition-all"
                      >
                        Update Company
                      </button>
                    </div>

                    {/* Delete Confirmation Modal */}
                    {showDeleteConfirm && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                        <div className="glass-card p-8 rounded-2xl border border-red-500/30 max-w-md w-full mx-4">
                          <div className="text-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                              <i className="fa-solid fa-exclamation-triangle text-red-400 text-2xl"></i>
                            </div>
                            <h3 className="font-heading text-xl font-bold text-white mb-2 uppercase">
                              Delete Seller Profile?
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                              This will permanently delete all seller information, remove your company from the directory, and change your account to buyer-only. This action cannot be undone.
                            </p>
                          </div>
                          <div className="flex gap-4">
                            <button
                              onClick={() => setShowDeleteConfirm(false)}
                              className="flex-1 bg-white/5 border border-white/10 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-white/10 transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleDeleteSellerProfile}
                              disabled={isDeletingProfile}
                              className="flex-1 bg-red-500 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-red-600 hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isDeletingProfile ? 'Deleting...' : 'Delete Profile'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* My Posts Tab */}
              {activeTab === 'my-posts' && (
                <div className="space-y-8">
                  {/* Wishlist Requests Section */}
                  <div className="glass-card p-8 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                      <h3 className="font-bold text-lg text-white uppercase tracking-wide">My Sourcing Requests</h3>
                      <Link
                        href="/post-request"
                        className="text-xs text-marcan-red font-bold uppercase hover:text-white transition"
                      >
                        + Post New Request
                      </Link>
                    </div>

                    {myWishlistRequests.length === 0 ? (
                      <div className="text-center py-12">
                        <i className="fa-solid fa-bullhorn text-4xl text-slate-600 mb-4"></i>
                        <p className="text-slate-400 text-sm mb-4">No sourcing requests posted yet.</p>
                        <Link
                          href="/post-request"
                          className="text-marcan-red hover:text-white text-sm font-bold uppercase transition"
                        >
                          Post Your First Request
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {myWishlistRequests.map((request) => (
                          <div
                            key={request.id}
                            className="glass-card p-4 rounded-xl border border-white/5 hover:border-marcan-red/30 transition-all relative"
                          >
                            <button
                              onClick={() => handleDeleteWishlistRequest(request.id)}
                              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 flex items-center justify-center text-red-400 hover:text-red-300 transition-all"
                              title="Delete request"
                            >
                              <i className="fa-solid fa-trash text-xs"></i>
                            </button>
                            <div className="flex justify-between items-start mb-2 pr-10">
                              <div>
                                <h4 className="text-white font-bold text-sm uppercase">{request.title}</h4>
                                <div className="text-xs text-slate-500 mt-1">
                                  {new Date(request.createdAt || request.timestamp).toLocaleDateString()}
                                </div>
                              </div>
                              <span className="px-2 py-1 rounded bg-white/5 text-slate-300 text-[10px] font-bold uppercase border border-white/10">
                                {request.category}
                              </span>
                            </div>
                            <p className="text-slate-400 text-xs mb-2 leading-relaxed line-clamp-2">
                              {request.specifications || request.description}
                            </p>
                            <div className="flex gap-4 text-xs text-slate-500">
                              {request.quantity && <span>Qty: {request.quantity}</span>}
                              {request.targetPrice && <span>Price: {request.targetPrice}</span>}
                              {request.deadline && (
                                <span>Deadline: {new Date(request.deadline).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Supplier Listings Section */}
                  {(user?.role === 'both' || user?.role === 'sell') && (
                    <div className="glass-card p-8 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                        <h3 className="font-bold text-lg text-white uppercase tracking-wide">My Supplier Listings</h3>
                        <Link
                          href="/create-listing"
                          className="text-xs text-marcan-red font-bold uppercase hover:text-white transition"
                        >
                          + Create New Listing
                        </Link>
                      </div>

                      {mySupplierListings.length === 0 ? (
                        <div className="text-center py-12">
                          <i className="fa-solid fa-shop text-4xl text-slate-600 mb-4"></i>
                          <p className="text-slate-400 text-sm mb-4">No supplier listings created yet.</p>
                          <Link
                            href="/create-listing"
                            className="text-marcan-red hover:text-white text-sm font-bold uppercase transition"
                          >
                            Create Your First Listing
                          </Link>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {mySupplierListings.map((listing) => (
                            <div
                              key={listing.id}
                              className="glass-card rounded-xl overflow-hidden group hover:border-marcan-red/50 transition-all relative"
                            >
                              <button
                                onClick={() => handleDeleteSupplierListing(listing.id)}
                                className="absolute top-2 right-2 z-10 w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 flex items-center justify-center text-red-400 hover:text-red-300 transition-all"
                                title="Delete listing"
                              >
                                <i className="fa-solid fa-trash text-xs"></i>
                              </button>
                              <div className="h-32 bg-black/40 flex items-center justify-center text-slate-600 relative">
                                <i className="fa-solid fa-box text-3xl group-hover:text-white transition-colors"></i>
                              </div>
                              <div className="p-4 border-t border-white/5">
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-bold text-white text-sm uppercase truncate pr-8">{listing.title}</h3>
                                  <span className="font-bold text-marcan-red text-sm">{listing.price}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 mb-2">
                                  {listing.listingType} • {listing.condition}
                                </div>
                                <p className="text-slate-400 text-xs mb-3 line-clamp-2">{listing.description}</p>
                                <div className="text-[10px] text-slate-500">
                                  {new Date(listing.createdAt || listing.timestamp).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
