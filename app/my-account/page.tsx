'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';

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

export default function MyAccountPage() {
  const { isAuthenticated, user, isLoading, isMounted, login } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'my-posts'>('profile');
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    jobTitle: '',
    email: '',
    companyName: '',
    businessNumber: '',
    website: '',
    aboutUs: '',
    // Seller-specific fields
    city: '',
    province: '',
    provincesServed: [] as string[],
    companyType: null as string | null,
    processes: [] as string[], // capability IDs
    materials: [] as string[], // capability IDs
    finishes: [] as string[], // capability IDs
    certifications: [] as string[], // capability IDs
    industries: [] as string[], // capability IDs
    industryHubs: [] as string[],
    otherProcesses: '',
    otherMaterials: '',
    otherFinishes: '',
    otherCertifications: '',
    otherIndustries: '',
    typicalJobSize: [] as string[],
    leadTimeMinDays: '',
    leadTimeMaxDays: '',
    maxPartSizeMmX: '',
    maxPartSizeMmY: '',
    maxPartSizeMmZ: '',
    rfqEmail: '',
    phone: '',
    preferredContactMethod: null as string | null,
  });
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [availableCapabilities, setAvailableCapabilities] = useState<{
    PROCESS: any[];
    MATERIAL: any[];
    FINISH: any[];
    CERTIFICATION: any[];
    INDUSTRY: any[];
    COMPANY_TYPE: any[];
  }>({
    PROCESS: [],
    MATERIAL: [],
    FINISH: [],
    CERTIFICATION: [],
    INDUSTRY: [],
    COMPANY_TYPE: [],
  });
  const [supplierProfile, setSupplierProfile] = useState<any | null>(null);
  const [accountRole, setAccountRole] = useState<'buyer' | 'supplier'>('buyer');
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [myWishlistRequests, setMyWishlistRequests] = useState<any[]>([]);
  const [mySupplierListings, setMySupplierListings] = useState<any[]>([]);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
      setFormData((prev) => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        jobTitle: user.jobTitle || '',
        email: user.email || '',
        companyName: user.companyName || '',
        businessNumber: user.businessNumber || '',
        website: user.website || '',
        aboutUs: user.aboutUs || '',
      }));
      // Load capabilities and certifications from local user snapshot if present
      if (user.capabilities) {
        setCapabilities(user.capabilities);
      }
      if (user.certifications) {
        setCertifications(user.certifications);
      }
      // Load account role from auth user; role is managed by signup / become-seller flows only
      // Default to 'buyer' if not set
      setAccountRole(user.role === 'supplier' ? 'supplier' : 'buyer');
      // Keep active tab valid for the role
      setActiveTab('profile');

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
              setAccountRole('supplier');
            } else {
              setAccountRole('buyer');
            }

            // Hydrate all fields from the profile, including user info
            setFormData((prev) => ({
              ...prev,
              firstName: profile.firstName || prev.firstName,
              lastName: profile.lastName || prev.lastName,
              email: profile.email || prev.email,
              companyName: profile.companyName || prev.companyName,
              jobTitle: profile.jobTitle || prev.jobTitle,
              businessNumber: profile.businessNumber || prev.businessNumber,
              website: profile.website || prev.website,
              aboutUs: profile.aboutUs || prev.aboutUs,
              city: profile.city || prev.city,
              province: profile.province || prev.province,
              provincesServed: Array.isArray(profile.provincesServed) ? profile.provincesServed : prev.provincesServed,
              companyType: profile.companyType || prev.companyType,
              industryHubs: Array.isArray(profile.industryHubs) ? profile.industryHubs : prev.industryHubs,
              typicalJobSize: profile.typicalJobSize
                ? (Array.isArray(profile.typicalJobSize) ? profile.typicalJobSize : [profile.typicalJobSize])
                : prev.typicalJobSize,
              leadTimeMinDays: profile.leadTimeMinDays ? profile.leadTimeMinDays.toString() : prev.leadTimeMinDays,
              leadTimeMaxDays: profile.leadTimeMaxDays ? profile.leadTimeMaxDays.toString() : prev.leadTimeMaxDays,
              maxPartSizeMmX: profile.maxPartSizeMmX ? profile.maxPartSizeMmX.toString() : prev.maxPartSizeMmX,
              maxPartSizeMmY: profile.maxPartSizeMmY ? profile.maxPartSizeMmY.toString() : prev.maxPartSizeMmY,
              maxPartSizeMmZ: profile.maxPartSizeMmZ ? profile.maxPartSizeMmZ.toString() : prev.maxPartSizeMmZ,
              rfqEmail: profile.rfqEmail || prev.rfqEmail,
              phone: profile.phone || prev.phone,
              preferredContactMethod: profile.preferredContactMethod || prev.preferredContactMethod,
            }));

            // Load capability IDs from profileCapabilities if available
            if (profile.profileCapabilities && Array.isArray(profile.profileCapabilities)) {
              const processIds: string[] = [];
              const materialIds: string[] = [];
              const finishIds: string[] = [];
              const certIds: string[] = [];
              const industryIds: string[] = [];

              profile.profileCapabilities.forEach((pc: any) => {
                if (pc.capability) {
                  const type = pc.capability.type;
                  const id = pc.capability.id;
                  if (type === 'PROCESS') processIds.push(id);
                  else if (type === 'MATERIAL') materialIds.push(id);
                  else if (type === 'FINISH') finishIds.push(id);
                  else if (type === 'CERTIFICATION') certIds.push(id);
                  else if (type === 'INDUSTRY') industryIds.push(id);
                }
              });

              setFormData((prev) => ({
                ...prev,
                processes: processIds,
                materials: materialIds,
                finishes: finishIds,
                certifications: certIds,
                industries: industryIds,
              }));
            }

            // Prefer capabilities / certifications from the supplier profile if present (for display)
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

  // Load capabilities when entering edit mode
  useEffect(() => {
    if (isEditMode && supplierProfile) {
      const loadCapabilities = async () => {
        try {
          const types = ['PROCESS', 'MATERIAL', 'FINISH', 'CERTIFICATION', 'INDUSTRY', 'COMPANY_TYPE'];
          const promises = types.map(async (type) => {
            try {
              const res = await fetch(`/api/capabilities?type=${type}`);
              const data = await res.json();
              return Array.isArray(data) ? data : [];
            } catch (err) {
              console.error(`Error loading ${type} capabilities:`, err);
              return [];
            }
          });

          const results = await Promise.all(promises);
          setAvailableCapabilities({
            PROCESS: results[0],
            MATERIAL: results[1],
            FINISH: results[2],
            CERTIFICATION: results[3],
            INDUSTRY: results[4],
            COMPANY_TYPE: results[5],
          });
        } catch (err) {
          console.error('Error loading capabilities:', err);
        }
      };
      loadCapabilities();
    }
  }, [isEditMode, supplierProfile]);

  const getInitials = () => {
    if (user) {
      const firstInitial = user.firstName.charAt(0).toUpperCase();
      const lastInitial = user.lastName?.charAt(0).toUpperCase() || '';
      return firstInitial + lastInitial;
    }
    return 'JS';
  };

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter((i) => i !== item);
    }
    return [...array, item];
  };

  const handleSaveProfile = async () => {
    if (!user || !user.email) return;

    setIsSaving(true);
    setError('');

    try {
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

      // Update auth state
      login(updatedUser);

      // Update profile in database (works for both buyer and seller profiles)
      // First, check if profile exists
      const profileCheckResponse = await fetch(`/api/profiles?userId=${encodeURIComponent(user.email)}`);

      if (profileCheckResponse.ok) {
        // Profile exists, update it via profiles API
        const existingProfile = await profileCheckResponse.json();
        const response = await fetch('/api/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            companyName: existingProfile.companyName || formData.companyName || `${formData.firstName} ${formData.lastName}`.trim(),
            jobTitle: formData.jobTitle || null,
            // Preserve all existing profile data
            onboardingMethod: existingProfile.onboardingMethod || 'MANUAL',
            city: existingProfile.city || formData.city || null,
            province: existingProfile.province || formData.province || null,
            provincesServed: existingProfile.provincesServed || formData.provincesServed || [],
            website: existingProfile.website || formData.website || null,
            companyType: existingProfile.companyType || formData.companyType || null,
            processes: existingProfile.profileCapabilities?.filter((pc: any) => pc.capability?.type === 'PROCESS').map((pc: any) => pc.capabilityId) || formData.processes || [],
            materials: existingProfile.profileCapabilities?.filter((pc: any) => pc.capability?.type === 'MATERIAL').map((pc: any) => pc.capabilityId) || formData.materials || [],
            finishes: existingProfile.profileCapabilities?.filter((pc: any) => pc.capability?.type === 'FINISH').map((pc: any) => pc.capabilityId) || formData.finishes || [],
            certifications: existingProfile.profileCapabilities?.filter((pc: any) => pc.capability?.type === 'CERTIFICATION').map((pc: any) => pc.capabilityId) || formData.certifications || [],
            industries: existingProfile.profileCapabilities?.filter((pc: any) => pc.capability?.type === 'INDUSTRY').map((pc: any) => pc.capabilityId) || formData.industries || [],
            typicalJobSize: existingProfile.typicalJobSize || null,
            leadTimeMinDays: existingProfile.leadTimeMinDays || null,
            leadTimeMaxDays: existingProfile.leadTimeMaxDays || null,
            maxPartSizeMmX: existingProfile.maxPartSizeMmX || null,
            maxPartSizeMmY: existingProfile.maxPartSizeMmY || null,
            maxPartSizeMmZ: existingProfile.maxPartSizeMmZ || null,
            aboutUs: existingProfile.aboutUs || formData.aboutUs || null,
            rfqEmail: existingProfile.rfqEmail || formData.rfqEmail || null,
            phone: existingProfile.phone || formData.phone || null,
            preferredContactMethod: existingProfile.preferredContactMethod || formData.preferredContactMethod || null,
            primaryIntent: existingProfile.primaryIntent || 'buy',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || errorData.error || 'Failed to update profile');
        }

        // Reload the profile to get updated data
        const profileResponse = await fetch(`/api/profiles?userId=${encodeURIComponent(user.email)}`);
        if (profileResponse.ok) {
          const updatedProfile = await profileResponse.json();
          setSupplierProfile(updatedProfile);
        }
      } else if (profileCheckResponse.status === 404) {
        // Profile doesn't exist, create a buyer profile via /api/users
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            companyName: formData.companyName || `${formData.firstName} ${formData.lastName}`.trim(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save profile');
        }
      } else {
        throw new Error('Failed to check profile status');
      }

      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
      setSaveMessage({ type: 'error', text: err.message || 'Failed to save profile' });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCompany = async () => {
    if (!user || !user.email) return;

    setIsSaving(true);
    setError('');

    try {
      // Combine "other" fields into comments for AI search
      const otherComments = [
        formData.otherProcesses && `Other Processes: ${formData.otherProcesses}`,
        formData.otherMaterials && `Other Materials: ${formData.otherMaterials}`,
        formData.otherFinishes && `Other Finishes: ${formData.otherFinishes}`,
        formData.otherCertifications && `Other Certifications: ${formData.otherCertifications}`,
        formData.otherIndustries && `Other Industries: ${formData.otherIndustries}`,
      ]
        .filter(Boolean)
        .join('; ');

      // Normalize typicalJobSize array to single value (highest priority)
      const jobSizeOrder = ['PROTOTYPE', 'LOW_VOLUME', 'MEDIUM_VOLUME', 'HIGH_VOLUME'];
      const normalizedTypicalJobSize =
        Array.isArray(formData.typicalJobSize) && formData.typicalJobSize.length > 0
          ? jobSizeOrder.find(size => formData.typicalJobSize.includes(size)) || null
          : null;

      const submitData = {
        userId: user.email,
        onboardingMethod: supplierProfile?.onboardingMethod || 'MANUAL',
        companyName: formData.companyName,
        city: formData.city,
        province: formData.province,
        provincesServed: formData.provincesServed,
        website: formData.website || null,
        companyType: formData.companyType,
        processes: formData.processes,
        materials: formData.materials,
        finishes: formData.finishes,
        certifications: formData.certifications,
        industries: formData.industries,
        typicalJobSize: normalizedTypicalJobSize,
        leadTimeMinDays: formData.leadTimeMinDays ? parseInt(formData.leadTimeMinDays, 10) : null,
        leadTimeMaxDays: formData.leadTimeMaxDays ? parseInt(formData.leadTimeMaxDays, 10) : null,
        maxPartSizeMmX: formData.maxPartSizeMmX ? parseInt(formData.maxPartSizeMmX, 10) : null,
        maxPartSizeMmY: formData.maxPartSizeMmY ? parseInt(formData.maxPartSizeMmY, 10) : null,
        maxPartSizeMmZ: formData.maxPartSizeMmZ ? parseInt(formData.maxPartSizeMmZ, 10) : null,
        aboutUs: formData.aboutUs || null,
        rfqEmail: formData.rfqEmail,
        phone: formData.phone || null,
        preferredContactMethod: formData.preferredContactMethod,
        otherComments: otherComments || null,
        jobTitle: formData.jobTitle || null,
        businessNumber: formData.businessNumber || null,
      };

      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to update profile');
      }

      // Reload the profile to get updated data
      const profileResponse = await fetch(`/api/profiles?userId=${encodeURIComponent(user.email)}`);
      if (profileResponse.ok) {
        const updatedProfile = await profileResponse.json();
        setSupplierProfile(updatedProfile);
      }

      setIsEditMode(false);
      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
      setSaveMessage({ type: 'error', text: err.message || 'Failed to update profile' });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
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
        // Change role back to 'buyer'
        role: 'buyer',
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
      setFormData((prev) => ({
        ...prev,
        firstName: updatedUser.firstName || '',
        lastName: updatedUser.lastName || '',
        jobTitle: '',
        email: updatedUser.email || '',
        companyName: '',
        businessNumber: '',
        website: '',
        aboutUs: '',
      }));
      setCapabilities([]);
      setCertifications([]);
      setAccountRole('buyer');

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

  const handleDeactivateAccount = async () => {
    if (!user) return;

    setIsDeletingProfile(true);
    setError('');

    try {
      const response = await fetch('/api/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.email,
          action: 'deactivate',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to deactivate account');
      }

      await response.json();

      setShowDeleteConfirm(false);
      setSaveMessage({
        type: 'success',
        text: 'Your account has been marked as deactivated and scheduled for deletion in 30 days. Log in again before then to keep it active.',
      });
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (err: any) {
      console.error('Error deactivating account:', err);
      setError(err.message || 'Failed to deactivate account');
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
              <p className="text-slate-400 text-sm">
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
                {accountRole === 'supplier' ? 'My Supplier Company Profile' : 'My Buyer Profile'}
              </button>
              {/* For supplier accounts, we don't show a separate buyer tab */}
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
              {/* TAB: Buyer Profile */}
              {activeTab === 'profile' && accountRole === 'buyer' && (
                <div className="account-tab block animate-fade-in">
                  <div className="glass-card p-8 rounded-3xl border border-white/5">
                    <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                      <h3 className="font-heading font-black text-xl text-white uppercase tracking-wide">
                        My Buyer Profile Information
                      </h3>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Last updated: Today</span>
                    </div>

                    {/* Account Role - read only */}
                    <div className="mb-6 p-5 rounded-xl border border-white/5 bg-black/20 flex justify-between items-center">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
                          Account Role
                        </label>
                        <div className="text-white font-bold text-sm">
                          Buyer
                        </div>
                      </div>
                      {/* Role is intentionally read-only – no change role button */}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                          First Name <span className="text-marcan-red">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                          Last Name <span className="text-marcan-red">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                          required
                        />
                      </div>
                    </div>
                    <div className="mb-6">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                        Email Address <span className="text-marcan-red">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                        required
                      />
                    </div>
                    <div className="mb-6">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                        Company (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Organization you represent"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all placeholder:text-slate-600"
                      />
                    </div>
                    {formData.companyName.trim() && (
                      <div className="mb-6">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                          Role in Company <span className="text-marcan-red">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Procurement Manager, Buyer, Director"
                          value={formData.jobTitle}
                          onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all placeholder:text-slate-600"
                          required={formData.companyName.trim() !== ''}
                        />
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-marcan-red text-xs font-bold uppercase tracking-wider hover:text-red-400 transition-colors flex items-center gap-2"
                      >
                        <i className="fa-solid fa-trash-can"></i> Delete Account
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="bg-white/5 border border-white/10 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-marcan-red hover:border-marcan-red hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: Supplier Profile */}
              {activeTab === 'profile' && accountRole === 'supplier' && (
                <div className="account-tab block animate-fade-in">
                  <div className="glass-card p-8 rounded-3xl border border-white/5">
                    <div className="mb-8 border-b border-white/5 pb-4">
                      <h3 className="font-heading font-black text-xl text-white uppercase tracking-wide">
                        My Supplier Company Profile Information
                      </h3>
                    </div>

                    {/* Account Role - read only */}
                    <div className="mb-8 p-5 rounded-xl border border-white/5 bg-black/20 flex justify-between items-center">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
                          Account Role
                        </label>
                        <div className="text-white font-bold text-sm">
                          Supplier
                        </div>
                      </div>
                      {/* Role is intentionally read-only – no change role button */}
                    </div>

                    {/* Personal Account Information */}
                    <div className="mb-8 border-b border-white/5 pb-6">
                      <h4 className="text-[10px] font-bold text-marcan-red uppercase tracking-widest mb-4">Account Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                            First Name <span className="text-marcan-red">*</span>
                          </label>
                          {isEditMode ? (
                            <input
                              type="text"
                              value={formData.firstName}
                              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                              required
                            />
                          ) : (
                            <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                              {formData.firstName || supplierProfile?.firstName || user?.firstName || 'Not specified'}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                            Last Name <span className="text-marcan-red">*</span>
                          </label>
                          {isEditMode ? (
                            <input
                              type="text"
                              value={formData.lastName}
                              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                              required
                            />
                          ) : (
                            <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                              {formData.lastName || supplierProfile?.lastName || user?.lastName || 'Not specified'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                            Role/Position in Company <span className="text-marcan-red">*</span>
                          </label>
                          {isEditMode ? (
                            <input
                              type="text"
                              placeholder="e.g., Procurement Manager, Owner, Operations Director"
                              value={formData.jobTitle}
                              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all placeholder:text-slate-600"
                              required
                            />
                          ) : (
                            <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                              {formData.jobTitle || supplierProfile?.jobTitle || 'Not specified'}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                            Email Address <span className="text-marcan-red">*</span>
                          </label>
                          {isEditMode ? (
                            <input
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                              required
                            />
                          ) : (
                            <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                              {formData.email || supplierProfile?.email || user?.email || 'Not specified'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Core company fields (name / BN / website) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                          Company Legal Name <span className="text-marcan-red">*</span>
                        </label>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={formData.companyName}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all placeholder:text-slate-600"
                            placeholder="Enter company name"
                          />
                        ) : (
                          <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                            {formData.companyName || supplierProfile?.companyName || 'Not specified'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                          Business Number (BN)
                        </label>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={formData.businessNumber}
                            onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all placeholder:text-slate-600"
                            placeholder="Optional"
                          />
                        ) : (
                          <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                            {formData.businessNumber || supplierProfile?.businessNumber || 'Not specified'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                          Website URL
                        </label>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all placeholder:text-slate-600"
                            placeholder="www.example.com"
                          />
                        ) : (
                          <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                            {formData.website || supplierProfile?.website || 'Not specified'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Location & Company Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                          City <span className="text-marcan-red">*</span>
                        </label>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all placeholder:text-slate-600"
                            placeholder="Enter city"
                          />
                        ) : (
                          <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                            {formData.city || supplierProfile?.city || 'Not specified'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                          Province <span className="text-marcan-red">*</span>
                        </label>
                        {isEditMode ? (
                          <select
                            value={formData.province}
                            onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                          >
                            <option value="">Select Province</option>
                            {CANADIAN_PROVINCES.map((p) => (
                              <option key={p.code} value={p.code}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                            {formData.province || supplierProfile?.province || 'Not specified'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                          Provinces Served <span className="text-marcan-red">*</span>
                        </label>
                        {isEditMode ? (
                          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-black/20 rounded-lg border border-white/10">
                            {CANADIAN_PROVINCES.map((p) => (
                              <label key={p.code} className="flex items-center gap-2 text-xs text-white cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.provincesServed.includes(p.code)}
                                  onChange={() => setFormData({
                                    ...formData,
                                    provincesServed: toggleArrayItem(formData.provincesServed, p.code)
                                  })}
                                  className="rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                                />
                                {p.name}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                            {Array.isArray(formData.provincesServed) && formData.provincesServed.length > 0
                              ? formData.provincesServed.map(code => CANADIAN_PROVINCES.find(p => p.code === code)?.name || code).join(', ')
                              : Array.isArray(supplierProfile?.provincesServed) && supplierProfile.provincesServed.length > 0
                                ? supplierProfile.provincesServed.map((code: string) => CANADIAN_PROVINCES.find(p => p.code === code)?.name || code).join(', ')
                                : 'Not specified'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                          Company Type
                        </label>
                        {isEditMode ? (
                          <select
                            value={formData.companyType || ''}
                            onChange={(e) => setFormData({ ...formData, companyType: e.target.value || null })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all"
                          >
                            <option value="">Select Company Type</option>
                            {availableCapabilities.COMPANY_TYPE.map((ct) => (
                              <option key={ct.id} value={ct.name}>
                                {ct.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                            {formData.companyType || supplierProfile?.companyType || 'Not specified'}
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                          Industry Hub(s) <span className="text-marcan-red">*</span>
                        </label>
                        {isEditMode ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-black/20 rounded-lg border border-white/10">
                            {['Precision Machining', 'Foundries & Casting', 'Surface Finishing', 'Tooling & Molds', 'Automation'].map((hub) => (
                              <label key={hub} className="flex items-center gap-2 p-2 rounded bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50">
                                <input
                                  type="checkbox"
                                  checked={formData.industryHubs.includes(hub)}
                                  onChange={() => setFormData({
                                    ...formData,
                                    industryHubs: toggleArrayItem(formData.industryHubs, hub)
                                  })}
                                  className="rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                                />
                                <span className="text-[10px] font-bold text-white uppercase">{hub}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                            {Array.isArray(formData.industryHubs) && formData.industryHubs.length > 0
                              ? formData.industryHubs.join(', ')
                              : Array.isArray(supplierProfile?.industryHubs) && supplierProfile.industryHubs.length > 0
                                ? supplierProfile.industryHubs.join(', ')
                                : 'Not specified'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* About Us */}
                    <div className="mb-8">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                        About Us
                      </label>
                      {isEditMode ? (
                        <textarea
                          rows={4}
                          value={formData.aboutUs}
                          onChange={(e) => setFormData({ ...formData, aboutUs: e.target.value })}
                          placeholder="Describe your company's mission, history, and core focus..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all placeholder:text-slate-600"
                        />
                      ) : (
                        <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300 min-h-[100px]">
                          {formData.aboutUs || supplierProfile?.aboutUs || 'Not specified'}
                        </div>
                      )}
                    </div>

                    {/* Processes, Materials, Finishes */}
                    {isEditMode ? (
                      <>
                        <div className="mb-8">
                          <label className="text-[10px] font-bold text-marcan-red uppercase tracking-widest mb-3 block">
                            Processes <span className="text-marcan-red">*</span>
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3 max-h-60 overflow-y-auto p-3 bg-black/20 rounded-lg border border-white/10">
                            {availableCapabilities.PROCESS.map((cap) => (
                              <label key={cap.id} className="flex items-center gap-2 p-2 rounded bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50">
                                <input
                                  type="checkbox"
                                  checked={formData.processes.includes(cap.id)}
                                  onChange={() => setFormData({
                                    ...formData,
                                    processes: toggleArrayItem(formData.processes, cap.id)
                                  })}
                                  className="rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                                />
                                <span className="text-[10px] font-bold text-white uppercase">{cap.name}</span>
                              </label>
                            ))}
                          </div>
                          <input
                            type="text"
                            value={formData.otherProcesses}
                            onChange={(e) => setFormData({ ...formData, otherProcesses: e.target.value })}
                            placeholder="Other processes (comma-separated)"
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          />
                        </div>
                        <div className="mb-8">
                          <label className="text-[10px] font-bold text-marcan-red uppercase tracking-widest mb-3 block">
                            Materials <span className="text-marcan-red">*</span>
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3 max-h-60 overflow-y-auto p-3 bg-black/20 rounded-lg border border-white/10">
                            {availableCapabilities.MATERIAL.map((cap) => (
                              <label key={cap.id} className="flex items-center gap-2 p-2 rounded bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50">
                                <input
                                  type="checkbox"
                                  checked={formData.materials.includes(cap.id)}
                                  onChange={() => setFormData({
                                    ...formData,
                                    materials: toggleArrayItem(formData.materials, cap.id)
                                  })}
                                  className="rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                                />
                                <span className="text-[10px] font-bold text-white uppercase">{cap.name}</span>
                              </label>
                            ))}
                          </div>
                          <input
                            type="text"
                            value={formData.otherMaterials}
                            onChange={(e) => setFormData({ ...formData, otherMaterials: e.target.value })}
                            placeholder="Other materials (comma-separated)"
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          />
                        </div>
                        <div className="mb-8">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">
                            Finishes (Optional)
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3 max-h-60 overflow-y-auto p-3 bg-black/20 rounded-lg border border-white/10">
                            {availableCapabilities.FINISH.map((cap) => (
                              <label key={cap.id} className="flex items-center gap-2 p-2 rounded bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50">
                                <input
                                  type="checkbox"
                                  checked={formData.finishes.includes(cap.id)}
                                  onChange={() => setFormData({
                                    ...formData,
                                    finishes: toggleArrayItem(formData.finishes, cap.id)
                                  })}
                                  className="rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                                />
                                <span className="text-[10px] font-bold text-white uppercase">{cap.name}</span>
                              </label>
                            ))}
                          </div>
                          <input
                            type="text"
                            value={formData.otherFinishes}
                            onChange={(e) => setFormData({ ...formData, otherFinishes: e.target.value })}
                            placeholder="Other finishes (comma-separated)"
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="mb-8">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                          Processes <span className="text-marcan-red">*</span>
                        </label>
                        <div className="p-4 rounded-xl border border-white/5 bg-black/20 flex flex-wrap gap-2 items-center min-h-[60px]">
                          {capabilities.length > 0 ? (
                            capabilities.map((item) => (
                              <span key={item} className="px-3 py-1.5 rounded-lg bg-marcan-red text-white text-[10px] font-bold uppercase tracking-wider">
                                {item}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500 italic">Not specified</span>
                          )}
                        </div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block mt-4">
                          Materials <span className="text-marcan-red">*</span>
                        </label>
                        <div className="p-4 rounded-xl border border-white/5 bg-black/20 flex flex-wrap gap-2 items-center min-h-[60px]">
                          {supplierProfile?.materials && Array.isArray(supplierProfile.materials) && supplierProfile.materials.length > 0 ? (
                            supplierProfile.materials.map((item: string) => (
                              <span key={item} className="px-3 py-1.5 rounded-lg bg-marcan-red text-white text-[10px] font-bold uppercase tracking-wider">
                                {item}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500 italic">Not specified</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Certifications & Industries */}
                    {isEditMode ? (
                      <>
                        <div className="mb-8">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">
                            Certifications
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3 max-h-60 overflow-y-auto p-3 bg-black/20 rounded-lg border border-white/10">
                            {availableCapabilities.CERTIFICATION.map((cap) => (
                              <label key={cap.id} className="flex items-center gap-2 p-2 rounded bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50">
                                <input
                                  type="checkbox"
                                  checked={formData.certifications.includes(cap.id)}
                                  onChange={() => setFormData({
                                    ...formData,
                                    certifications: toggleArrayItem(formData.certifications, cap.id)
                                  })}
                                  className="rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                                />
                                <span className="text-[10px] font-bold text-white uppercase">{cap.name}</span>
                              </label>
                            ))}
                          </div>
                          <input
                            type="text"
                            value={formData.otherCertifications}
                            onChange={(e) => setFormData({ ...formData, otherCertifications: e.target.value })}
                            placeholder="Other certifications (comma-separated)"
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          />
                        </div>
                        <div className="mb-8">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">
                            Industries
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3 max-h-60 overflow-y-auto p-3 bg-black/20 rounded-lg border border-white/10">
                            {availableCapabilities.INDUSTRY.map((cap) => (
                              <label key={cap.id} className="flex items-center gap-2 p-2 rounded bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50">
                                <input
                                  type="checkbox"
                                  checked={formData.industries.includes(cap.id)}
                                  onChange={() => setFormData({
                                    ...formData,
                                    industries: toggleArrayItem(formData.industries, cap.id)
                                  })}
                                  className="rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                                />
                                <span className="text-[10px] font-bold text-white uppercase">{cap.name}</span>
                              </label>
                            ))}
                          </div>
                          <input
                            type="text"
                            value={formData.otherIndustries}
                            onChange={(e) => setFormData({ ...formData, otherIndustries: e.target.value })}
                            placeholder="Other industries (comma-separated)"
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mb-8">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                            Certifications
                          </label>
                          <div className="p-4 rounded-xl border border-white/5 bg-black/20 flex flex-wrap gap-2 items-center min-h-[60px]">
                            {certifications.length > 0 ? (
                              certifications.map((item) => (
                                <span key={item} className="px-3 py-1.5 rounded-lg bg-white/10 text-slate-200 text-[10px] font-bold uppercase tracking-wider border border-white/10">
                                  {item}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-500 italic">Not specified</span>
                            )}
                          </div>
                        </div>
                        <div className="mb-8">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                            Industries
                          </label>
                          <div className="p-4 rounded-xl border border-white/5 bg-black/20 flex flex-wrap gap-2 items-center min-h-[60px]">
                            {supplierProfile?.industries && Array.isArray(supplierProfile.industries) && supplierProfile.industries.length > 0 ? (
                              supplierProfile.industries.map((item: string) => (
                                <span key={item} className="px-3 py-1.5 rounded-lg bg-white/10 text-slate-200 text-[10px] font-bold uppercase tracking-wider border border-white/10">
                                  {item}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-500 italic">Not specified</span>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Production Profile: Typical Job Size, Lead Times, Max Part Size */}
                    <div className="mb-8">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                        Typical Job Size
                      </label>
                      {isEditMode ? (
                        <div className="space-y-2">
                          <label className="flex items-start gap-3 p-3 rounded-lg bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50">
                            <input
                              type="checkbox"
                              checked={formData.typicalJobSize.includes('PROTOTYPE')}
                              onChange={() => setFormData({
                                ...formData,
                                typicalJobSize: toggleArrayItem(formData.typicalJobSize, 'PROTOTYPE')
                              })}
                              className="mt-0.5 rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                            />
                            <div className="text-xs text-slate-200">
                              <div className="font-semibold text-white">Prototype</div>
                              <div>One-offs, testing, early design — <span className="text-slate-400">1–10 parts</span></div>
                            </div>
                          </label>
                          <label className="flex items-start gap-3 p-3 rounded-lg bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50">
                            <input
                              type="checkbox"
                              checked={formData.typicalJobSize.includes('LOW_VOLUME')}
                              onChange={() => setFormData({
                                ...formData,
                                typicalJobSize: toggleArrayItem(formData.typicalJobSize, 'LOW_VOLUME')
                              })}
                              className="mt-0.5 rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                            />
                            <div className="text-xs text-slate-200">
                              <div className="font-semibold text-white">Low Volume</div>
                              <div>Small production runs — <span className="text-slate-400">10–500 parts</span></div>
                            </div>
                          </label>
                          <label className="flex items-start gap-3 p-3 rounded-lg bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50">
                            <input
                              type="checkbox"
                              checked={formData.typicalJobSize.includes('MEDIUM_VOLUME')}
                              onChange={() => setFormData({
                                ...formData,
                                typicalJobSize: toggleArrayItem(formData.typicalJobSize, 'MEDIUM_VOLUME')
                              })}
                              className="mt-0.5 rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                            />
                            <div className="text-xs text-slate-200">
                              <div className="font-semibold text-white">Medium Volume</div>
                              <div>Repeat production — <span className="text-slate-400">500–5,000 parts</span></div>
                            </div>
                          </label>
                          <label className="flex items-start gap-3 p-3 rounded-lg bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50">
                            <input
                              type="checkbox"
                              checked={formData.typicalJobSize.includes('HIGH_VOLUME')}
                              onChange={() => setFormData({
                                ...formData,
                                typicalJobSize: toggleArrayItem(formData.typicalJobSize, 'HIGH_VOLUME')
                              })}
                              className="mt-0.5 rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                            />
                            <div className="text-xs text-slate-200">
                              <div className="font-semibold text-white">High Volume</div>
                              <div>Mass production — <span className="text-slate-400">5,000+ parts</span></div>
                            </div>
                          </label>
                        </div>
                      ) : (
                        <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300 min-h-[50px]">
                          {Array.isArray(formData.typicalJobSize) && formData.typicalJobSize.length > 0
                            ? formData.typicalJobSize.map(size => {
                              const labels: Record<string, string> = {
                                'PROTOTYPE': 'Prototype',
                                'LOW_VOLUME': 'Low Volume',
                                'MEDIUM_VOLUME': 'Medium Volume',
                                'HIGH_VOLUME': 'High Volume'
                              };
                              return labels[size] || size;
                            }).join(', ')
                            : supplierProfile?.typicalJobSize
                              ? (() => {
                                const labels: Record<string, string> = {
                                  'PROTOTYPE': 'Prototype',
                                  'LOW_VOLUME': 'Low Volume',
                                  'MEDIUM_VOLUME': 'Medium Volume',
                                  'HIGH_VOLUME': 'High Volume'
                                };
                                return labels[supplierProfile.typicalJobSize] || supplierProfile.typicalJobSize;
                              })()
                              : 'Not specified'}
                        </div>
                      )}
                    </div>
                    {formData.phone?.trim() && (
                      <div className="mb-8">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                          Preferred Contact Method
                        </label>
                        {isEditMode ? (
                          <div className="grid grid-cols-2 gap-4">
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, preferredContactMethod: 'EMAIL' })}
                              className={`p-4 rounded-lg border-2 transition-all text-left ${formData.preferredContactMethod === 'EMAIL'
                                ? 'border-marcan-red bg-marcan-red/10'
                                : 'border-white/10 hover:border-marcan-red/50'
                                }`}
                            >
                              <div className="text-white font-bold text-sm uppercase">Email</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, preferredContactMethod: 'PHONE' })}
                              className={`p-4 rounded-lg border-2 transition-all text-left ${formData.preferredContactMethod === 'PHONE'
                                ? 'border-marcan-red bg-marcan-red/10'
                                : 'border-white/10 hover:border-marcan-red/50'
                                }`}
                            >
                              <div className="text-white font-bold text-sm uppercase">Phone</div>
                            </button>
                          </div>
                        ) : (
                          <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                            {(formData.preferredContactMethod === 'EMAIL' || supplierProfile?.preferredContactMethod === 'EMAIL')
                              ? 'Email'
                              : (formData.preferredContactMethod === 'PHONE' || supplierProfile?.preferredContactMethod === 'PHONE')
                                ? 'Phone'
                                : 'Not specified'}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                            Lead Time Min (days)
                          </label>
                          {isEditMode ? (
                            <input
                              type="number"
                              value={formData.leadTimeMinDays}
                              onChange={(e) => setFormData({ ...formData, leadTimeMinDays: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all placeholder:text-slate-600"
                              placeholder="Min days"
                            />
                          ) : (
                            <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                              {formData.leadTimeMinDays || supplierProfile?.leadTimeMinDays || 'Not specified'}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                            Lead Time Max (days)
                          </label>
                          {isEditMode ? (
                            <input
                              type="number"
                              value={formData.leadTimeMaxDays}
                              onChange={(e) => setFormData({ ...formData, leadTimeMaxDays: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all placeholder:text-slate-600"
                              placeholder="Max days"
                            />
                          ) : (
                            <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                              {formData.leadTimeMaxDays || supplierProfile?.leadTimeMaxDays || 'Not specified'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                            Max Part Size X (mm)
                          </label>
                          {isEditMode ? (
                            <input
                              type="number"
                              value={formData.maxPartSizeMmX}
                              onChange={(e) => setFormData({ ...formData, maxPartSizeMmX: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all placeholder:text-slate-600"
                              placeholder="mm"
                            />
                          ) : (
                            <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                              {formData.maxPartSizeMmX || supplierProfile?.maxPartSizeMmX || 'Not specified'}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                            Max Part Size Y (mm)
                          </label>
                          {isEditMode ? (
                            <input
                              type="number"
                              value={formData.maxPartSizeMmY}
                              onChange={(e) => setFormData({ ...formData, maxPartSizeMmY: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all placeholder:text-slate-600"
                              placeholder="mm"
                            />
                          ) : (
                            <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                              {formData.maxPartSizeMmY || supplierProfile?.maxPartSizeMmY || 'Not specified'}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                            Max Part Size Z (mm)
                          </label>
                          {isEditMode ? (
                            <input
                              type="number"
                              value={formData.maxPartSizeMmZ}
                              onChange={(e) => setFormData({ ...formData, maxPartSizeMmZ: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all placeholder:text-slate-600"
                              placeholder="mm"
                            />
                          ) : (
                            <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                              {formData.maxPartSizeMmZ || supplierProfile?.maxPartSizeMmZ || 'Not specified'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-bold text-marcan-red uppercase tracking-widest mb-2 block">
                          RFQ Email <span className="text-marcan-red">*</span>
                        </label>
                        {isEditMode ? (
                          <input
                            type="email"
                            value={formData.rfqEmail}
                            onChange={(e) => setFormData({ ...formData, rfqEmail: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all placeholder:text-slate-600"
                            placeholder="rfq@company.com"
                          />
                        ) : (
                          <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                            {formData.rfqEmail || supplierProfile?.rfqEmail || 'Not specified'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                          Phone Number
                        </label>
                        {isEditMode ? (
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all placeholder:text-slate-600"
                            placeholder="+1 (555) 000-0000"
                          />
                        ) : (
                          <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                            {formData.phone || supplierProfile?.phone || 'Not specified'}
                          </div>
                        )}
                      </div>
                    </div>


                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-marcan-red text-xs font-bold uppercase tracking-wider hover:text-red-400 transition-colors flex items-center gap-2"
                      >
                        <i className="fa-solid fa-trash-can"></i> Delete Account
                      </button>
                      {!isEditMode ? (
                        <button
                          onClick={() => setIsEditMode(true)}
                          className="bg-white/5 border border-white/10 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-marcan-red hover:border-marcan-red hover:shadow-neon transition-all"
                        >
                          <i className="fa-solid fa-pencil mr-2"></i> Edit Profile
                        </button>
                      ) : (
                        <div className="flex gap-3">
                          <button
                            onClick={() => setIsEditMode(false)}
                            className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-slate-600 transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleUpdateCompany}
                            disabled={isSaving}
                            className="bg-marcan-red border border-marcan-red text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      )}
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
                              Delete Account?
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                              This will mark your account as deactivated and schedule it for permanent deletion in 30 days. If you log in again before then, your account will be restored and the deletion will be cancelled.
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
                              onClick={handleDeactivateAccount}
                              disabled={isDeletingProfile}
                              className="flex-1 bg-red-500 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-red-600 hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isDeletingProfile ? 'Deactivating...' : 'Delete Account'}
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
                      {accountRole === 'buyer' ? (
                        <Link
                          href="/post-request"
                          className="text-xs text-marcan-red font-bold uppercase hover:text-white transition"
                        >
                          + Post New Request
                        </Link>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          Buyer accounts only
                        </span>
                      )}
                    </div>

                    {myWishlistRequests.length === 0 ? (
                      <div className="text-center py-12">
                        <i className="fa-solid fa-bullhorn text-4xl text-slate-600 mb-4"></i>
                        <p className="text-slate-400 text-sm mb-4">No sourcing requests posted yet.</p>
                        {accountRole === 'buyer' && (
                          <Link
                            href="/post-request"
                            className="text-marcan-red hover:text-white text-sm font-bold uppercase transition"
                          >
                            Post Your First Request
                          </Link>
                        )}
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
                  {accountRole === 'supplier' && (
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
