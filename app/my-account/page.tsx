'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [activeTab, setActiveTab] = useState<'profile' | 'buyer-profile' | 'my-posts'>('profile');
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    jobTitle: '',
    email: '',
    companyName: '',
    streetAddress: '',
    businessNumber: '',
    website: '',
    aboutUs: '',
    // Supplier-specific fields
    city: '',
    province: '',
    provincesServed: [] as string[],
    companyType: null as string | null,
    processes: [] as string[], // capability IDs
    materials: [] as string[], // capability IDs
    finishes: [] as string[], // capability IDs
    certifications: [] as string[], // capability IDs
    industries: [] as string[], // capability IDs
    industriesServed: [] as string[],
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
  const [storefrontProfile, setStorefrontProfile] = useState<any | null>(null);
  const [buyerProfile, setBuyerProfile] = useState<any | null>(null);
  const [accountRole, setAccountRole] = useState<'buyer' | 'supplier' | 'storefront'>('buyer');
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ type: 'wishlist' | 'listing'; id: string } | null>(null);
  const [myWishlistRequests, setMyWishlistRequests] = useState<any[]>([]);
  const [mySupplierListings, setMySupplierListings] = useState<any[]>([]);
  const [viewingListing, setViewingListing] = useState<any | null>(null);
  const [editingListing, setEditingListing] = useState<any | null>(null);
  const [listingFormData, setListingFormData] = useState({
    title: '',
    listingType: '',
    condition: '',
    price: '',
    location: '',
    description: '',
  });
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isDomReady, setIsDomReady] = useState(false);

  // Edit RFQ state
  const [editingRequest, setEditingRequest] = useState<any | null>(null);
  const [requestFormData, setRequestFormData] = useState({
    title: '',
    categories: [] as string[],
    quantity: '',
    specifications: '',
    deadline: '',
    asap: false,
    targetPrice: '',
    city: '',
    province: '',
  });

  const INDUSTRY_HUBS = [
    'Precision Machining',
    'Foundries & Casting',
    'Surface Finishing',
    'Tooling & Molds',
    'Automation',
  ];

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

  useEffect(() => {
    setIsDomReady(true);
  }, []);

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
        streetAddress: user.streetAddress || '',
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
      // Load account role from auth user; role is managed by signup / become-supplier flows only
      // Default to 'buyer' if not set
      setAccountRole(user.role === 'supplier' ? 'supplier' : user.role === 'seller' ? 'storefront' : 'buyer');
      // Keep active tab valid for the role
      setActiveTab('profile');

      // Load user's wishlist requests, listings, and rich supplier profile from API
      if (typeof window !== 'undefined' && user.email) {
        const normalizedUserId = String(user.email).toLowerCase();
        const hydrateStorefrontProfile = (sfProfile: any) => {
          setStorefrontProfile(sfProfile);
          setAccountRole('storefront');
          setFormData((prev) => ({
            ...prev,
            firstName: sfProfile.firstName || prev.firstName,
            lastName: sfProfile.lastName || prev.lastName,
            email: sfProfile.email || prev.email,
            companyName: sfProfile.companyName || prev.companyName,
            streetAddress: sfProfile.streetAddress || prev.streetAddress,
            jobTitle: sfProfile.role || prev.jobTitle,
            businessNumber: sfProfile.businessNumber || prev.businessNumber,
            website: sfProfile.website || prev.website,
            aboutUs: sfProfile.aboutUs || prev.aboutUs,
            city: sfProfile.city || prev.city,
            province: sfProfile.province || prev.province,
            phone: sfProfile.phone || prev.phone,
          }));
        };

        // Storefront profile is authoritative for storefront accounts.
        const storefrontProfilePromise = fetch(`/api/storefront-profile?userId=${encodeURIComponent(normalizedUserId)}`)
          .then((res) => (res.ok ? res.json() : null))
          .catch((err) => {
            console.error('Error fetching storefront profile:', err);
            return null;
          });

        // Fetch the supplier profile for this user (if it exists)
        fetch(`/api/profiles?userId=${encodeURIComponent(normalizedUserId)}`)
          .then((res) => {
            if (!res.ok) {
              if (res.status === 404) {
                return null;
              }
              throw new Error('Failed to fetch supplier profile');
            }
            return res.json();
          })
          .then(async (profile) => {
            const sfProfile = await storefrontProfilePromise;
            if (sfProfile) {
              setSupplierProfile(null);
              hydrateStorefrontProfile(sfProfile);
              return;
            }

            if (!profile) {
              setSupplierProfile(null);
              return;
            }

            setSupplierProfile(profile);

            // Supplier profile exists, so treat account as supplier.
            if (profile?.id) {
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
              industriesServed: Array.isArray(profile.industriesServed) ? profile.industriesServed : prev.industriesServed,
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

        // Fetch buyer profile so we can show the real "last updated" timestamp.
        fetch(`/api/users?userId=${encodeURIComponent(normalizedUserId)}`)
          .then((res) => {
            if (!res.ok) {
              if (res.status === 404) return null;
              throw new Error('Failed to fetch buyer profile');
            }
            return res.json();
          })
          .then((profile) => {
            if (!profile) {
              setBuyerProfile(null);
              return;
            }
            setBuyerProfile(profile);
          })
          .catch((err) => {
            console.error('Error fetching buyer profile:', err);
          });

        // Fetch user's own wishlist requests
        fetch(`/api/wishlist/my?userId=${encodeURIComponent(normalizedUserId)}`)
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

        // Fetch user's own supplier listings (check if user has supplier profile)
        fetch(`/api/listings/my?userId=${encodeURIComponent(normalizedUserId)}`)
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

  const getLastUpdatedText = (updatedAt?: string | Date | null) => {
    if (!updatedAt) return 'Last updated: --';

    const parsedDate = new Date(updatedAt);
    if (Number.isNaN(parsedDate.getTime())) return 'Last updated: --';
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(parsedDate);
    return `Last updated: ${formattedDate}`;
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

      // Update profile in database (works for both buyer and supplier profiles)
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

        const buyerSaveResult = await response.json();
        if (buyerSaveResult?.profile) {
          setBuyerProfile(buyerSaveResult.profile);
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

  const handleUpdateStorefrontProfile = async () => {
    if (!user || !user.email) return;
    setIsSaving(true);
    setError('');
    try {
      const response = await fetch('/api/storefront-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.email,
          firstName: formData.firstName || null,
          lastName: formData.lastName || null,
          email: formData.email || null,
          companyName: formData.companyName || 'Unnamed Company',
          role: formData.jobTitle || null,
          city: formData.city || null,
          province: formData.province || null,
          businessNumber: formData.businessNumber || null,
          streetAddress: formData.streetAddress || '',
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update storefront profile');
      }
      const updated = await response.json();
      setStorefrontProfile(updated);
      setIsEditMode(false);
      setSaveMessage({ type: 'success', text: 'Storefront profile updated successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || 'Failed to update storefront profile' });
      setTimeout(() => setSaveMessage(null), 4000);
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

  const handleStartEditRequest = (request: any) => {
    setEditingRequest(request);
    setRequestFormData({
      title: request.title || '',
      categories: request.category ? [request.category] : [],
      quantity: request.quantity || '',
      specifications: request.specifications || request.description || '',
      deadline: request.deadline ? String(request.deadline).slice(0, 10) : '',
      asap: !request.deadline,
      targetPrice: (request.targetPrice || '').replace(/[^0-9.]/g, ''),
      city: request.city || '',
      province: request.province || '',
    });
  };

  const handleSaveRequestEdit = async () => {
    if (!user?.email || !editingRequest) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/wishlist/${editingRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.email,
          title: requestFormData.title.trim(),
          category: requestFormData.categories[0] || null,
          quantity: requestFormData.quantity || null,
          specifications: requestFormData.specifications.trim(),
          deadline: requestFormData.asap ? null : (requestFormData.deadline || null),
          targetPrice: requestFormData.targetPrice || '',
          targetCity: requestFormData.city || null,
          targetProvince: requestFormData.province || null,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update request');
      }
      const updated = await response.json();
      setMyWishlistRequests((prev) =>
        prev.map((r) => (r.id === editingRequest.id ? { ...r, ...updated, time: r.time } : r))
      );
      setEditingRequest(null);
      setSaveMessage({ type: 'success', text: 'Request updated successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (e: any) {
      setSaveMessage({ type: 'error', text: e.message || 'Failed to update request' });
      setTimeout(() => setSaveMessage(null), 4000);
    } finally {
      setIsSaving(false);
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

  const handleStartEditListing = (listing: any) => {
    setViewingListing(null);
    setEditingListing(listing);
    setListingFormData({
      title: listing.title || '',
      listingType: listing.listingType || '',
      condition: listing.condition || '',
      price: listing.price || '',
      location: listing.location || '',
      description: listing.description || '',
    });
  };

  const handleSaveListingEdit = async () => {
    if (!user?.email || !editingListing) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/listings/${editingListing.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.email,
          title: listingFormData.title.trim(),
          listingType: listingFormData.listingType,
          condition: listingFormData.condition.trim() || null,
          price: listingFormData.price.trim(),
          location: listingFormData.location.trim(),
          description: listingFormData.description.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update listing');
      }

      const updatedListing = await response.json();
      setMySupplierListings((prev) =>
        prev.map((listing) => (listing.id === updatedListing.id ? { ...listing, ...updatedListing } : listing))
      );
      setEditingListing(null);
      setSaveMessage({ type: 'success', text: 'Listing updated successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      console.error('Error updating listing:', err);
      setSaveMessage({ type: 'error', text: err.message || 'Failed to update listing' });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSupplierProfile = async () => {
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
        throw new Error(errorData.details || errorData.error || 'Failed to delete supplier profile');
      }

      const result = await response.json();
      console.log('Profile deleted:', result);

      // Remove all supplier-related data from user profile
      const updatedUser = {
        ...user,
        // Remove supplier-specific fields
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
        text: `Supplier profile deleted successfully. Removed ${result.deletedListings || 0} listing(s) from marketplace and company from directory. Your account is now a buyer account.`
      });
      setTimeout(() => setSaveMessage(null), 5000);

      // Refresh the page to update the UI (remove Company Profile tab)
      // This also refreshes the directory and marketplace pages if they're open
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error('Error deleting supplier profile:', err);
      setError(err.message || 'Failed to delete supplier profile');
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
                {accountRole === 'supplier'
                  ? 'My Supplier Company Profile'
                  : accountRole === 'storefront'
                    ? 'My Storefront Profile'
                    : 'My Buyer Profile'}
              </button>
              {accountRole === 'supplier' && (
                <button
                  onClick={() => setActiveTab('buyer-profile')}
                  className={`account-nav-btn w-full text-left px-5 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider border-l-4 transition-all ${activeTab === 'buyer-profile'
                    ? 'bg-marcan-red/10 text-white border-marcan-red'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                    }`}
                >
                  My Buyer Profile
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
              {/* TAB: Buyer Profile */}
              {((activeTab === 'profile' && accountRole === 'buyer') || activeTab === 'buyer-profile') && (
                <div className="account-tab block animate-fade-in">
                  <div className="glass-card p-8 rounded-3xl border border-white/5">
                    <div className="mb-6 border-b border-white/5 pb-4">
                      <h3 className="font-heading font-black text-xl text-white uppercase tracking-wide">
                        My Buyer Profile Information
                      </h3>
                      <span className="mt-1 block text-[10px] text-slate-500 uppercase font-bold">
                        {getLastUpdatedText(
                          supplierProfile?.updatedAt || buyerProfile?.updatedAt || null
                        )}
                      </span>
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
                          First Name *<span className="text-marcan-red">*</span>
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
                            {formData.firstName || 'Not specified'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                          Last Name *<span className="text-marcan-red">*</span>
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
                            {formData.lastName || 'Not specified'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mb-6">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                        Email Address *<span className="text-marcan-red">*</span>
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
                          {formData.email || 'Not specified'}
                        </div>
                      )}
                    </div>
                    <div className="mb-6">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                        Company (Optional)
                      </label>
                      {isEditMode ? (
                        <input
                          type="text"
                          placeholder="Organization you represent"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all placeholder:text-slate-600"
                        />
                      ) : (
                        <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                          {formData.companyName || 'Not specified'}
                        </div>
                      )}
                    </div>
                    {formData.companyName.trim() && (
                      <div className="mb-6">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                          Role in Company *<span className="text-marcan-red">*</span>
                        </label>
                        {isEditMode ? (
                          <input
                            type="text"
                            placeholder="e.g., Procurement Manager, Buyer, Director"
                            value={formData.jobTitle}
                            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-marcan-red focus:shadow-neon outline-none transition-all placeholder:text-slate-600"
                            required={formData.companyName.trim() !== ''}
                          />
                        ) : (
                          <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                            {formData.jobTitle || 'Not specified'}
                          </div>
                        )}
                      </div>
                    )}

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
                            onClick={handleSaveProfile}
                            disabled={isSaving}
                            className="bg-marcan-red border border-marcan-red text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: Storefront Profile */}
              {activeTab === 'profile' && accountRole === 'storefront' && (
                <div className="account-tab block animate-fade-in">
                  <div className="glass-card p-8 rounded-3xl border border-white/5">
                    <div className="mb-6 border-b border-white/5 pb-4">
                      <h3 className="font-heading font-black text-xl text-white uppercase tracking-wide">
                        My Storefront Profile Information
                      </h3>
                      <span className="mt-1 block text-[10px] text-slate-500 uppercase font-bold">
                        {getLastUpdatedText(storefrontProfile?.updatedAt || null)}
                      </span>
                    </div>

                    <div className="mb-6 p-5 rounded-xl border border-white/5 bg-black/20 flex justify-between items-center">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
                          Account Role
                        </label>
                        <div className="text-white font-bold text-sm">
                          Storefront
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="p-4 rounded-xl border border-white/5 bg-black/20">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">First Name</label>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-marcan-red outline-none"
                          />
                        ) : (
                          <div className="text-sm text-white font-semibold">{formData.firstName || 'Not specified'}</div>
                        )}
                      </div>
                      <div className="p-4 rounded-xl border border-white/5 bg-black/20">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Last Name</label>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-marcan-red outline-none"
                          />
                        ) : (
                          <div className="text-sm text-white font-semibold">{formData.lastName || 'Not specified'}</div>
                        )}
                      </div>
                      <div className="p-4 rounded-xl border border-white/5 bg-black/20">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Email</label>
                        {isEditMode ? (
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-marcan-red outline-none"
                          />
                        ) : (
                          <div className="text-sm text-white font-semibold">{formData.email || 'Not specified'}</div>
                        )}
                      </div>
                      <div className="p-4 rounded-xl border border-white/5 bg-black/20">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Company Name</label>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={formData.companyName}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-marcan-red outline-none"
                          />
                        ) : (
                          <div className="text-sm text-white font-semibold">{formData.companyName || 'Not specified'}</div>
                        )}
                      </div>
                      <div className="p-4 rounded-xl border border-white/5 bg-black/20">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Job Title</label>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={formData.jobTitle}
                            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-marcan-red outline-none"
                          />
                        ) : (
                          <div className="text-sm text-white font-semibold">{formData.jobTitle || 'Not specified'}</div>
                        )}
                      </div>
                      <div className="p-4 rounded-xl border border-white/5 bg-black/20">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Street Address</label>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={formData.streetAddress}
                            onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-marcan-red outline-none"
                          />
                        ) : (
                          <div className="text-sm text-white font-semibold">{formData.streetAddress || 'Not specified'}</div>
                        )}
                      </div>
                      <div className="p-4 rounded-xl border border-white/5 bg-black/20">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">City</label>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-marcan-red outline-none"
                          />
                        ) : (
                          <div className="text-sm text-white font-semibold">{formData.city || 'Not specified'}</div>
                        )}
                      </div>
                      <div className="p-4 rounded-xl border border-white/5 bg-black/20">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Province</label>
                        {isEditMode ? (
                          <select
                            value={formData.province}
                            onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-marcan-red outline-none"
                          >
                            <option value="">Select province</option>
                            {CANADIAN_PROVINCES.map((p) => (
                              <option key={p.code} value={p.code}>{p.name}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-sm text-white font-semibold">{formData.province || 'Not specified'}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      {!isEditMode ? (
                        <button
                          onClick={() => setIsEditMode(true)}
                          className="bg-white/5 border border-white/10 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-marcan-red hover:border-marcan-red hover:shadow-neon transition-all"
                        >
                          <i className="fa-solid fa-pencil mr-2"></i> Edit Profile
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setIsEditMode(false)}
                            className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-slate-600 transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleUpdateStorefrontProfile}
                            disabled={isSaving}
                            className="bg-marcan-red border border-marcan-red text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                          </button>
                        </>
                      )}
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
                      <span className="mt-1 block text-[10px] text-slate-500 uppercase font-bold">
                        {getLastUpdatedText(supplierProfile?.updatedAt || null)}
                      </span>
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
                                  checked={formData.industriesServed.includes(hub)}
                                  onChange={() => setFormData({
                                    ...formData,
                                    industriesServed: toggleArrayItem(formData.industriesServed, hub)
                                  })}
                                  className="rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                                />
                                <span className="text-[10px] font-bold text-white uppercase">{hub}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300">
                            {Array.isArray(formData.industriesServed) && formData.industriesServed.length > 0
                              ? formData.industriesServed.join(', ')
                              : Array.isArray(supplierProfile?.industriesServed) && supplierProfile.industriesServed.length > 0
                                ? supplierProfile.industriesServed.join(', ')
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

              {/* Delete Item Confirmation Modal (wishlist request or listing) */}
              {pendingDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                  <div className="glass-card p-8 rounded-2xl border border-red-500/30 max-w-md w-full mx-4">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                        <i className="fa-solid fa-exclamation-triangle text-red-400 text-2xl"></i>
                      </div>
                      <h3 className="font-heading text-xl font-bold text-white mb-2 uppercase">
                        {pendingDelete.type === 'wishlist' ? 'Delete Request?' : 'Delete Listing?'}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        This action cannot be undone. Are you sure you want to permanently delete this {pendingDelete.type === 'wishlist' ? 'sourcing request' : 'storefront listing'}?
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setPendingDelete(null)}
                        className="flex-1 bg-white/5 border border-white/10 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-white/10 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          const target = pendingDelete;
                          setPendingDelete(null);
                          if (!target) return;
                          if (target.type === 'wishlist') {
                            await handleDeleteWishlistRequest(target.id);
                          } else {
                            await handleDeleteSupplierListing(target.id);
                          }
                        }}
                        className="flex-1 bg-red-500 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-red-600 hover:shadow-neon transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* My Posts Tab */}
              {activeTab === 'my-posts' && (
                <div className="space-y-8">
                  {/* Wishlist Requests Section */}
                  {accountRole !== 'storefront' && (
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
                          {myWishlistRequests.slice(0, 3).map((request) => (
                            <div
                              key={request.id}
                              className="glass-card p-4 rounded-xl border border-white/5 hover:border-marcan-red/30 transition-all relative"
                            >
                              <div className="absolute top-3 right-3">
                                <button
                                  onClick={() => setPendingDelete({ type: 'wishlist', id: request.id })}
                                  className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 flex items-center justify-center text-red-400 hover:text-red-300 transition-all"
                                  title="Delete request"
                                >
                                  <i className="fa-solid fa-trash text-xs"></i>
                                </button>
                              </div>
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
                              <div className="mt-3 flex justify-end">
                                <button
                                  onClick={() => handleStartEditRequest(request)}
                                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[11px] font-bold uppercase tracking-wider transition"
                                >
                                  Edit Request
                                </button>
                              </div>
                            </div>
                          ))}

                          {myWishlistRequests.length > 3 && (
                            <div className="pt-2">
                              <Link
                                href="/my-posts/requests"
                                className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white font-bold uppercase tracking-wider transition"
                              >
                                See all requests <i className="fa-solid fa-arrow-right text-[10px]"></i>
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Edit RFQ Modal */}
                  {editingRequest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                      <div className="glass-card p-6 rounded-2xl border border-white/10 w-full max-w-2xl">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-white font-bold uppercase text-sm tracking-wider">Edit Request</h4>
                          <button
                            onClick={() => setEditingRequest(null)}
                            className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition"
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Title</label>
                            <input
                              type="text"
                              value={requestFormData.title}
                              onChange={(e) => setRequestFormData({ ...requestFormData, title: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-marcan-red outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                                Industry Categories
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {INDUSTRY_HUBS.map((hub) => {
                                  const checked = requestFormData.categories.includes(hub);
                                  return (
                                    <label key={hub} className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2 cursor-pointer hover:bg-black/40 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setRequestFormData({ ...requestFormData, categories: [...requestFormData.categories, hub] });
                                          } else {
                                            setRequestFormData({ ...requestFormData, categories: requestFormData.categories.filter((c) => c !== hub) });
                                          }
                                        }}
                                        className="rounded border-white/20 bg-black/40 text-marcan-red focus:ring-0 cursor-pointer"
                                      />
                                      <span className="text-xs text-slate-300 font-semibold">{hub}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Quantity</label>
                              <input
                                type="text"
                                value={requestFormData.quantity}
                                onChange={(e) => setRequestFormData({ ...requestFormData, quantity: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-marcan-red outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Specifications</label>
                            <textarea
                              rows={4}
                              value={requestFormData.specifications}
                              onChange={(e) => setRequestFormData({ ...requestFormData, specifications: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-marcan-red outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Deadline</label>
                                <label className="flex items-center gap-2 text-[11px] text-slate-400">
                                  <input
                                    type="checkbox"
                                    checked={requestFormData.asap}
                                    onChange={(e) => setRequestFormData({ ...requestFormData, asap: e.target.checked, deadline: e.target.checked ? '' : requestFormData.deadline })}
                                    className="rounded border-white/20 bg-black/40 text-marcan-red focus:ring-0 cursor-pointer"
                                  />
                                  ASAP
                                </label>
                              </div>
                              <input
                                type="date"
                                value={requestFormData.deadline}
                                onChange={(e) => setRequestFormData({ ...requestFormData, deadline: e.target.value })}
                                disabled={requestFormData.asap}
                                className={`w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm ${requestFormData.asap ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400'} focus:border-marcan-red outline-none`}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Target Price</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={requestFormData.targetPrice}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9.]/g, '');
                                    if (/^\d*\.?\d{0,2}$/.test(value)) {
                                      setRequestFormData({ ...requestFormData, targetPrice: value });
                                    }
                                  }}
                                  className="w-full bg-black/40 border border-white/10 rounded-lg pl-7 pr-3 py-2 text-sm text-white focus:border-marcan-red outline-none"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">City</label>
                              <input
                                type="text"
                                value={requestFormData.city}
                                onChange={(e) => setRequestFormData({ ...requestFormData, city: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-marcan-red outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Province</label>
                              <select
                                value={requestFormData.province}
                                onChange={(e) => setRequestFormData({ ...requestFormData, province: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-marcan-red outline-none"
                              >
                                <option value="">Province</option>
                                {CANADIAN_PROVINCES.map((p) => (
                                  <option key={p.code} value={p.code}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end gap-3 pt-2">
                            <button
                              onClick={() => setEditingRequest(null)}
                              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition"
                            >
                              Cancel
                            </button>
                            <button
                              disabled={isSaving}
                              onClick={handleSaveRequestEdit}
                              className="px-5 py-2 rounded-lg bg-marcan-red text-white text-xs font-bold uppercase tracking-wider hover:shadow-neon transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Storefront Listings Section */}
                  {(accountRole === 'supplier' || accountRole === 'storefront') && (
                    <div className="glass-card p-8 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                        <h3 className="font-bold text-lg text-white uppercase tracking-wide">My Storefront Listings</h3>
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
                          <p className="text-slate-400 text-sm mb-4">No storefront listings created yet.</p>
                          <Link
                            href="/create-listing"
                            className="text-marcan-red hover:text-white text-sm font-bold uppercase transition"
                          >
                            Create Your First Listing
                          </Link>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {mySupplierListings.slice(0, 3).map((listing) => (
                            <div
                              key={listing.id}
                              className="glass-card rounded-2xl border border-white/5 hover:border-orange-500/50 transition-all duration-300 flex flex-col group overflow-hidden relative"
                            >
                              <button
                                onClick={() => setPendingDelete({ type: 'listing', id: listing.id })}
                                className="absolute top-3 right-3 z-20 w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 flex items-center justify-center text-red-400 hover:text-red-300 transition-all"
                                title="Delete listing"
                              >
                                <i className="fa-solid fa-trash text-xs"></i>
                              </button>

                              <div className="p-5 flex flex-col flex-grow">
                                {listing.listingType ? (
                                  <div className="mb-3">
                                    <span className="inline-flex px-2 py-1 text-[9px] font-bold uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded">
                                      {listing.listingType}
                                    </span>
                                  </div>
                                ) : null}

                                <h3 className="font-heading font-bold text-white mb-1 line-clamp-1 pr-10">
                                  {listing.title || 'Untitled listing'}
                                </h3>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-3 line-clamp-1">
                                  <i className="fa-solid fa-store text-orange-400 mr-1"></i>
                                  {listing.supplier || formData.companyName || 'My Company'}
                                </p>

                                <p className="text-xs text-slate-400 line-clamp-1 mb-4">
                                  {listing.description || 'No description available.'}
                                </p>

                                <div className="mt-auto flex items-end justify-between mb-4 gap-3">
                                  <span className="text-xl font-black text-white truncate">
                                    {listing.price || 'Negotiable'}
                                  </span>
                                  <span className="text-xs text-slate-400 shrink-0">
                                    <i className="fa-solid fa-location-dot mr-1"></i>
                                    {listing.location || 'N/A'}
                                  </span>
                                </div>

                                <div className="flex flex-col gap-2">
                                  <button
                                    onClick={() => setViewingListing(listing)}
                                    className="w-full py-2.5 rounded-lg bg-white/5 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors border border-white/5"
                                  >
                                    View Listing
                                  </button>
                                  <button
                                    onClick={() => handleStartEditListing(listing)}
                                    className="w-full py-2.5 rounded-lg bg-white/5 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors border border-white/5"
                                  >
                                    Edit Listing
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {mySupplierListings.length > 3 && (
                        <div className="pt-6">
                          <Link
                            href="/my-posts/listings"
                            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white font-bold uppercase tracking-wider transition"
                          >
                            View all listings <i className="fa-solid fa-arrow-right text-[10px]"></i>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {isDomReady && viewingListing &&
                createPortal(
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <button
                      type="button"
                      className="absolute inset-0 bg-marcan-dark/90 backdrop-blur-sm"
                      onClick={() => setViewingListing(null)}
                      aria-label="Close view listing modal"
                    />
                    <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-card rounded-3xl border border-white/10 shadow-2xl flex flex-col">
                      <div className="sticky top-0 z-20 flex justify-between items-center p-6 border-b border-white/10 bg-marcan-dark/95 backdrop-blur-md">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded text-[10px] font-bold uppercase shrink-0">
                            {viewingListing.listingType || 'Listing'}
                          </span>
                          <h3 className="font-heading font-bold text-xl md:text-2xl text-white truncate">
                            {viewingListing.title || 'Untitled listing'}
                          </h3>
                        </div>
                        <button
                          onClick={() => setViewingListing(null)}
                          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all border border-white/5"
                          aria-label="Close view listing modal"
                        >
                          <i className="fa-solid fa-xmark text-lg"></i>
                        </button>
                      </div>
                      <div className="p-6 md:p-8 space-y-8 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          <div className="lg:col-span-2 space-y-8">
                            <div>
                              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <i className="fa-solid fa-align-left text-orange-400"></i> Description
                              </h4>
                              <div className="glass-card p-6 rounded-2xl border border-white/5 text-sm text-slate-300 leading-relaxed">
                                <p>{viewingListing.description || 'No description available for this listing.'}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <i className="fa-solid fa-list-check text-orange-400"></i> Listing Details
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col">
                                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Type</span>
                                  <span className="text-sm font-semibold text-white">{viewingListing.listingType || 'Not specified'}</span>
                                </div>
                                <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col">
                                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Price</span>
                                  <span className="text-sm font-semibold text-white">{viewingListing.price || 'Negotiable'}</span>
                                </div>
                                <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col">
                                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Location</span>
                                  <span className="text-sm font-semibold text-white">{viewingListing.location || 'Not specified'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-6">
                            <div className="glass-card p-6 rounded-2xl border border-orange-500/20 bg-gradient-to-b from-orange-500/5 to-transparent shadow-[0_0_30px_rgba(249,115,22,0.05)]">
                              <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-2">Asking Price</div>
                              <div className="text-4xl font-black text-white tracking-tight mb-6">
                                {viewingListing.price || 'Negotiable'}
                              </div>
                              <button
                                onClick={() => handleStartEditListing(viewingListing)}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                              >
                                <i className="fa-solid fa-pen"></i> Edit Listing
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>,
                  document.body
                )
              }

              {editingListing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                  <div className="glass-card p-6 rounded-2xl border border-white/10 w-full max-w-2xl">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="font-heading text-xl font-bold text-white uppercase">Edit Listing</h3>
                      <button
                        onClick={() => setEditingListing(null)}
                        className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300"
                        aria-label="Close edit listing modal"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Listing Title</label>
                        <input
                          value={listingFormData.title}
                          onChange={(e) => setListingFormData((prev) => ({ ...prev, title: e.target.value }))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Category</label>
                        <select
                          value={listingFormData.listingType}
                          onChange={(e) => setListingFormData((prev) => ({ ...prev, listingType: e.target.value }))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500 outline-none"
                        >
                          <option value="Equipment / Machinery">Equipment / Machinery</option>
                          <option value="Raw Materials">Raw Materials</option>
                          <option value="Surplus Parts">Surplus Parts</option>
                          <option value="Extra Space">Extra Space</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Price</label>
                        <input
                          value={listingFormData.price}
                          onChange={(e) => setListingFormData((prev) => ({ ...prev, price: e.target.value }))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Location</label>
                        <input
                          value={listingFormData.location}
                          onChange={(e) => setListingFormData((prev) => ({ ...prev, location: e.target.value }))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Description</label>
                      <textarea
                        value={listingFormData.description}
                        onChange={(e) => setListingFormData((prev) => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500 outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setEditingListing(null)}
                        className="bg-white/5 border border-white/10 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveListingEdit}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? 'Saving...' : 'Save Listing'}
                      </button>
                    </div>
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
