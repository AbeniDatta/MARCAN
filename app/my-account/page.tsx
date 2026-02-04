'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

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
  const [accountRole, setAccountRole] = useState<string>('both');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
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

      // Load user's wishlist requests and listings from API
      if (typeof window !== 'undefined' && user.email) {
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

        // Fetch user's own supplier listings (only if seller)
        if (user.role === 'both' || user.role === 'sell') {
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
        } else {
          setMySupplierListings([]);
        }
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

  const handleUpdatePassword = async () => {
    setPasswordError('');
    setSaveMessage(null);

    // Validate current password is provided
    if (!passwordData.currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }

    // Validate new password matches confirmation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match!');
      return;
    }

    // Validate new password length
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters!');
      return;
    }

    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !user?.email) {
      setPasswordError('User not authenticated');
      return;
    }

    try {
      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);

      // Update password
      await updatePassword(firebaseUser, passwordData.newPassword);

      // Success
      setSaveMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordError('');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      // Handle Firebase Auth errors
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPasswordError('Current password does not match');
      } else if (err.code === 'auth/weak-password') {
        setPasswordError('Password is too weak. Please choose a stronger password.');
      } else {
        setPasswordError(err.message || 'Failed to update password');
      }
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

          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-marcan-red to-red-900 flex items-center justify-center text-2xl font-bold text-white shadow-neon">
              {getInitials()}
            </div>
            <div>
              <h2 className="font-heading text-3xl font-bold text-white">
                {user?.firstName || formData.firstName} {user?.lastName || formData.lastName}
              </h2>
              <p className="text-slate-400 text-sm">
                {formData.jobTitle} <span className="text-white font-bold">{formData.companyName}</span>
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
              {/* Only show Company Profile tab if user is a seller */}
              {(user?.role === 'both' || user?.role === 'sell') && (
                <button
                  onClick={() => setActiveTab('company')}
                  className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition ${activeTab === 'company'
                    ? 'bg-marcan-red/10 text-white border-l-2 border-marcan-red'
                    : 'hover:bg-white/5 text-slate-400 hover:text-white'
                    }`}
                >
                  Company Profile
                </button>
              )}
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition ${activeTab === 'security'
                  ? 'bg-marcan-red/10 text-white border-l-2 border-marcan-red'
                  : 'hover:bg-white/5 text-slate-400 hover:text-white'
                  }`}
              >
                Security
              </button>
              <button
                onClick={() => setActiveTab('my-posts')}
                className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition ${activeTab === 'my-posts'
                  ? 'bg-marcan-red/10 text-white border-l-2 border-marcan-red'
                  : 'hover:bg-white/5 text-slate-400 hover:text-white'
                  }`}
              >
                My Posts
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
                      <label className="text-[10px] font-bold text-marcan-red uppercase mb-2 block">Your Job Title</label>
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
                    <label className="text-[10px] font-bold text-marcan-red uppercase mb-2 block">Account Role</label>
                    <div className="text-sm text-white font-semibold">
                      {accountRole === 'buy' && 'Buyer Only'}
                      {accountRole === 'sell' && 'Supplier Only'}
                      {accountRole === 'both' && 'Both (Buyer & Supplier)'}
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-6 mt-6">
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
                      >
                        <i className="fa-solid fa-trash"></i> Delete Seller Profile
                      </button>
                      <button
                        onClick={handleUpdateCompany}
                        className="bg-white/5 border border-white/10 text-white px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-marcan-red hover:border-marcan-red hover:shadow-neon transition-all"
                      >
                        Update Company
                      </button>
                    </div>
                  </div>

                  {/* Delete Confirmation Modal */}
                  {showDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                      <div className="glass-card p-8 rounded-2xl border border-red-500/30 max-w-md w-full mx-4">
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                            <i className="fa-solid fa-exclamation-triangle text-red-400 text-2xl"></i>
                          </div>
                          <h3 className="font-heading text-xl font-bold text-white mb-2 uppercase">Delete Seller Profile?</h3>
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

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="glass-card p-8 rounded-2xl border border-white/5">
                  <h3 className="font-bold text-lg text-white mb-6 uppercase tracking-wide border-b border-white/5 pb-4">
                    Security
                  </h3>

                  {/* Password Error Message */}
                  {passwordError && (
                    <div className="mb-6 p-4 rounded-lg border bg-red-500/10 border-red-500/30 text-red-400 text-sm font-bold uppercase tracking-wider">
                      {passwordError}
                    </div>
                  )}

                  <div className="space-y-6 mb-6">
                    <div>
                      <label className="text-[10px] font-bold text-marcan-red uppercase mb-2 block">Current Password</label>
                      <input
                        type="password"
                        placeholder="Enter your current password"
                        value={passwordData.currentPassword}
                        onChange={(e) => {
                          setPasswordData({ ...passwordData, currentPassword: e.target.value });
                          setPasswordError('');
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all placeholder:text-slate-600"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-bold text-marcan-red uppercase mb-2 block">New Password</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={passwordData.newPassword}
                          onChange={(e) => {
                            setPasswordData({ ...passwordData, newPassword: e.target.value });
                            setPasswordError('');
                          }}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-marcan-red uppercase mb-2 block">Confirm Password</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={passwordData.confirmPassword}
                          onChange={(e) => {
                            setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                            setPasswordError('');
                          }}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                        />
                      </div>
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
