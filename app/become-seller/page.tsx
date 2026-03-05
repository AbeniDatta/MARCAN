'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';

type WizardStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type View = 'landing' | 'form';
type OnboardingMethod = 'IMPORT' | 'MANUAL';
type TypicalJobSize = 'PROTOTYPE' | 'LOW_VOLUME' | 'MEDIUM_VOLUME' | 'HIGH_VOLUME';
type TypicalLeadTime =
  | 'ONE_TWO_WEEKS'
  | 'TWO_FOUR_WEEKS'
  | 'ONE_THREE_MONTHS'
  | 'THREE_PLUS_MONTHS'
  | 'DEPENDS_ON_WORKLOAD';
type PreferredContactMethod = 'EMAIL' | 'PHONE' | 'PLATFORM_ONLY';

interface Capability {
  id: string;
  type: string;
  slug: string;
  name: string;
}

const INDUSTRY_HUB_NAMES = ['Precision Machining', 'Foundries & Casting', 'Surface Finishing', 'Tooling & Molds', 'Automation'];

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

export default function BecomeSellerPage() {
  const router = useRouter();
  const { login, user: currentUser, isAuthenticated, isMounted } = useAuth();
  const [currentView, setCurrentView] = useState<View>('form');
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [lastCompletedStep, setLastCompletedStep] = useState<WizardStep | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [error, setError] = useState('');
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [capabilities, setCapabilities] = useState<{
    PROCESS: Capability[];
    MATERIAL: Capability[];
    FINISH: Capability[];
    CERTIFICATION: Capability[];
    INDUSTRY: Capability[];
    COMPANY_TYPE: Capability[];
  }>({
    PROCESS: [],
    MATERIAL: [],
    FINISH: [],
    CERTIFICATION: [],
    INDUSTRY: [],
    COMPANY_TYPE: [],
  });

  // Form state
  const [formData, setFormData] = useState({
    // Step 0
    onboardingMethod: null as OnboardingMethod | null,
    // Step 1
    companyName: '',
    city: '',
    province: '',
    provincesServed: [] as string[],
    companyType: null as string | null,
    website: '',
    // Step 2
    processes: [] as string[], // capability IDs
    materials: [] as string[], // capability IDs
    finishes: [] as string[], // capability IDs
    otherProcesses: '', // custom processes not in list
    otherMaterials: '', // custom materials not in list
    otherFinishes: '', // custom finishes not in list
    // Step 3
    typicalJobSize: [] as TypicalJobSize[],
    typicalLeadTime: null as TypicalLeadTime | null,
    leadTimeMinDays: '',
    leadTimeMaxDays: '',
    maxPartSizeMmX: '',
    maxPartSizeMmY: '',
    maxPartSizeMmZ: '',
    // Step 4
    certifications: [] as string[], // capability IDs
    industries: [] as string[], // capability IDs
    industryHubs: [] as string[],
    otherCertifications: '', // custom certifications not in list
    otherIndustries: '', // custom industries not in list
    aboutUs: '',
    // Step 5
    rfqEmail: '',
    phone: '',
    preferredContactMethod: null as PreferredContactMethod | null,
    // Step 6
    firstName: '',
    lastName: '',
    role: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  // Load capabilities on mount
  useEffect(() => {
    const loadCapabilities = async () => {
      try {
        const types = ['PROCESS', 'MATERIAL', 'FINISH', 'CERTIFICATION', 'INDUSTRY', 'COMPANY_TYPE'];
        const promises = types.map(async (type) => {
          try {
            const res = await fetch(`/api/capabilities?type=${type}`);
            const data = await res.json();
            // Ensure we always return an array
            return Array.isArray(data) ? data : [];
          } catch (err) {
            console.error(`Error loading ${type} capabilities:`, err);
            return [];
          }
        });
        const results = await Promise.all(promises);
        setCapabilities({
          PROCESS: Array.isArray(results[0]) ? results[0] : [],
          MATERIAL: Array.isArray(results[1]) ? results[1] : [],
          FINISH: Array.isArray(results[2]) ? results[2] : [],
          CERTIFICATION: Array.isArray(results[3]) ? results[3] : [],
          INDUSTRY: Array.isArray(results[4]) ? results[4] : [],
          COMPANY_TYPE: Array.isArray(results[5]) ? results[5] : [],
        });
      } catch (err) {
        console.error('Error loading capabilities:', err);
        // Ensure capabilities are always arrays even on error
        setCapabilities({
          PROCESS: [],
          MATERIAL: [],
          FINISH: [],
          CERTIFICATION: [],
          INDUSTRY: [],
          COMPANY_TYPE: [],
        });
      }
    };
    loadCapabilities();
  }, []);

  // Load saved form data from localStorage
  useEffect(() => {
    if (isMounted && currentUser?.email) {
      const savedDataKey = `seller_registration_${currentUser.email}`;
      const savedData = localStorage.getItem(savedDataKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.formData) {
            // Ensure all array fields are properly initialized as arrays and string fields have defaults
            const loadedFormData = {
              ...parsed.formData,
              provincesServed: Array.isArray(parsed.formData.provincesServed) ? parsed.formData.provincesServed : [],
              processes: Array.isArray(parsed.formData.processes) ? parsed.formData.processes : [],
              materials: Array.isArray(parsed.formData.materials) ? parsed.formData.materials : [],
              finishes: Array.isArray(parsed.formData.finishes) ? parsed.formData.finishes : [],
              certifications: Array.isArray(parsed.formData.certifications) ? parsed.formData.certifications : [],
              industries: Array.isArray(parsed.formData.industries) ? parsed.formData.industries : [],
              industryHubs: Array.isArray(parsed.formData.industryHubs) ? parsed.formData.industryHubs : [],
              typicalJobSize: Array.isArray(parsed.formData.typicalJobSize)
                ? parsed.formData.typicalJobSize
                : parsed.formData.typicalJobSize
                  ? [parsed.formData.typicalJobSize]
                  : [],
              phone: parsed.formData.phone || '',
            };
            setFormData(loadedFormData);
          }
          if (parsed.lastCompletedStep !== undefined && parsed.lastCompletedStep !== null) {
            setLastCompletedStep(parsed.lastCompletedStep);
          }
        } catch (err) {
          console.error('Error loading saved form data:', err);
        }
      }
    }
  }, [isMounted, currentUser]);

  // Save form data to localStorage whenever it changes (debounced)
  useEffect(() => {
    if (isMounted && currentUser?.email) {
      const savedDataKey = `seller_registration_${currentUser.email}`;
      const dataToSave = {
        formData,
        lastCompletedStep,
        wizardStep,
      };
      // Debounce the save to avoid too many writes
      const timeoutId = setTimeout(() => {
        localStorage.setItem(savedDataKey, JSON.stringify(dataToSave));
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [formData, lastCompletedStep, wizardStep, isMounted, currentUser]);

  const [hasProcessedQueryParams, setHasProcessedQueryParams] = useState(false);

  // Initialize view based on query params (start=import or start=manual from signup)
  useEffect(() => {
    if (!isMounted || hasProcessedQueryParams) return;
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const start = params.get('start');
    const urlFromQuery = params.get('url');

    if (start === 'import' && urlFromQuery) {
      setCurrentView('form');
      setWizardStep(1);
      setIsImporting(true);
      setHasProcessedQueryParams(true);

      const runImport = async () => {
        try {
          const response = await fetch('/api/import-website', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ websiteUrl: urlFromQuery.trim() }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to import website' }));
            throw new Error(errorData.error || 'Failed to import website');
          }

          const result = await response.json();
          const importedData = result.data;

          setFormData((prev) => ({
            ...prev,
            onboardingMethod: 'IMPORT',
            companyName: importedData.companyName || prev.companyName,
            city: importedData.city || prev.city,
            province: importedData.province || prev.province,
            provincesServed: Array.isArray(importedData.provincesServed)
              ? importedData.provincesServed
              : prev.provincesServed || [],
            companyType: importedData.companyType || prev.companyType,
            website: importedData.website || urlFromQuery.trim(),
            processes: Array.isArray(importedData.processes) ? importedData.processes : prev.processes || [],
            materials: Array.isArray(importedData.materials) ? importedData.materials : prev.materials || [],
            finishes: Array.isArray(importedData.finishes) ? importedData.finishes : prev.finishes || [],
            certifications: Array.isArray(importedData.certifications)
              ? importedData.certifications
              : prev.certifications || [],
            industries: Array.isArray(importedData.industries) ? importedData.industries : prev.industries || [],
            otherProcesses: importedData.otherProcesses || prev.otherProcesses,
            otherMaterials: importedData.otherMaterials || prev.otherMaterials,
            otherFinishes: importedData.otherFinishes || prev.otherFinishes,
            otherCertifications: importedData.otherCertifications || prev.otherCertifications,
            otherIndustries: importedData.otherIndustries || prev.otherIndustries,
            typicalJobSize: importedData.typicalJobSize
              ? [importedData.typicalJobSize]
              : Array.isArray(prev.typicalJobSize)
                ? prev.typicalJobSize
                : [],
            leadTimeMinDays: importedData.leadTimeMinDays || prev.leadTimeMinDays,
            leadTimeMaxDays: importedData.leadTimeMaxDays || prev.leadTimeMaxDays,
            maxPartSizeMmX: importedData.maxPartSizeMmX || prev.maxPartSizeMmX,
            maxPartSizeMmY: importedData.maxPartSizeMmY || prev.maxPartSizeMmY,
            maxPartSizeMmZ: importedData.maxPartSizeMmZ || prev.maxPartSizeMmZ,
            aboutUs: importedData.aboutUs || prev.aboutUs,
            rfqEmail: importedData.rfqEmail || prev.rfqEmail,
            phone: importedData.phone || prev.phone,
            preferredContactMethod: importedData.preferredContactMethod || prev.preferredContactMethod,
            industryHubs: Array.isArray(importedData.industryHubs) ? importedData.industryHubs : prev.industryHubs,
          }));
        } catch (err: any) {
          console.error('Auto-import error:', err);
          setError(err.message || 'Failed to import website. You can still fill out your profile manually.');
        } finally {
          setIsImporting(false);
        }
      };

      runImport();
    } else if (start === 'manual') {
      setCurrentView('form');
      setWizardStep(1);
      setFormData((prev) => ({
        ...prev,
        onboardingMethod: 'MANUAL',
      }));
      setHasProcessedQueryParams(true);
    }
  }, [isMounted, hasProcessedQueryParams]);

  // Redirect if user already has a seller profile
  useEffect(() => {
    if (isMounted && isAuthenticated && currentUser?.email) {
      fetch(`/api/profiles?userId=${encodeURIComponent(currentUser.email)}`)
        .then((res) => {
          if (!res.ok) {
            if (res.status === 404) {
              // No profile exists, they can proceed
              return null;
            }
            throw new Error('Failed to fetch profile');
          }
          return res.json();
        })
        .then((profile) => {
          if (profile && (profile.primaryIntent === 'sell' || profile.primaryIntent === 'both')) {
            // User already has a seller profile, redirect to my account
            router.replace('/my-account');
          }
        })
        .catch((err) => {
          console.error('Error checking seller profile:', err);
          // On error, allow them to proceed (they might not have a profile yet)
        });
    }
  }, [isMounted, isAuthenticated, currentUser?.email, router]);

  const handleImportWebsite = async () => {
    if (!importUrl.trim()) {
      setError('Please enter a website URL');
      return;
    }

    setIsImporting(true);
    setError('');

    try {
      const response = await fetch('/api/import-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl: importUrl.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import website');
      }

      const result = await response.json();
      const importedData = result.data;

      // Pre-fill form data with imported information
      setFormData({
        ...formData,
        onboardingMethod: 'IMPORT',
        companyName: importedData.companyName || formData.companyName,
        city: importedData.city || formData.city,
        province: importedData.province || formData.province,
        provincesServed: Array.isArray(importedData.provincesServed)
          ? importedData.provincesServed
          : formData.provincesServed || [],
        companyType: importedData.companyType || formData.companyType,
        website: importedData.website || importUrl.trim(),
        processes: Array.isArray(importedData.processes) ? importedData.processes : formData.processes || [],
        materials: Array.isArray(importedData.materials) ? importedData.materials : formData.materials || [],
        finishes: Array.isArray(importedData.finishes) ? importedData.finishes : formData.finishes || [],
        certifications: Array.isArray(importedData.certifications)
          ? importedData.certifications
          : formData.certifications || [],
        industries: Array.isArray(importedData.industries) ? importedData.industries : formData.industries || [],
        // Handle "other" fields for unmatched capabilities
        otherProcesses: importedData.otherProcesses || formData.otherProcesses,
        otherMaterials: importedData.otherMaterials || formData.otherMaterials,
        otherFinishes: importedData.otherFinishes || formData.otherFinishes,
        otherCertifications: importedData.otherCertifications || formData.otherCertifications,
        otherIndustries: importedData.otherIndustries || formData.otherIndustries,
        typicalJobSize: importedData.typicalJobSize
          ? [importedData.typicalJobSize]
          : Array.isArray(formData.typicalJobSize)
            ? formData.typicalJobSize
            : [],
        leadTimeMinDays: importedData.leadTimeMinDays || formData.leadTimeMinDays,
        leadTimeMaxDays: importedData.leadTimeMaxDays || formData.leadTimeMaxDays,
        maxPartSizeMmX: importedData.maxPartSizeMmX || formData.maxPartSizeMmX,
        maxPartSizeMmY: importedData.maxPartSizeMmY || formData.maxPartSizeMmY,
        maxPartSizeMmZ: importedData.maxPartSizeMmZ || formData.maxPartSizeMmZ,
        aboutUs: importedData.aboutUs || formData.aboutUs,
        rfqEmail: importedData.rfqEmail || formData.rfqEmail,
        phone: importedData.phone || formData.phone,
        preferredContactMethod: importedData.preferredContactMethod || formData.preferredContactMethod,
      });

      // Mark step 0 as completed and move to step 1
      setLastCompletedStep(0);
      setWizardStep(1);
      setError('');
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message || 'Failed to import website. Please try again or fill manually.');
    } finally {
      setIsImporting(false);
    }
  };

  const saveAndNextStep = () => {
    if (validateStep(wizardStep)) {
      // Save current step as completed
      setLastCompletedStep(wizardStep);

      // Move to next step
      if (wizardStep < 6) {
        setWizardStep((prev) => (prev + 1) as WizardStep);
        setError('');
      }
    }
  };

  const prevStep = () => {
    if (wizardStep > 0) {
      setWizardStep((prev) => (prev - 1) as WizardStep);
      setError('');
    }
  };

  const validateStep = (step: WizardStep): boolean => {
    switch (step) {
      case 0:
        // Step 0 validation is handled in the import flow
        if (formData.onboardingMethod === 'IMPORT' && !importUrl.trim()) {
          setError('Please enter a website URL');
          return false;
        }
        if (!formData.onboardingMethod) {
          setError('Please select an onboarding method');
          return false;
        }
        return true;
      case 1:
        if (!formData.companyName || !formData.city || !formData.province || formData.provincesServed.length === 0) {
          setError('Company name, city, province, and at least one province served are required');
          return false;
        }
        if (!formData.industryHubs || formData.industryHubs.length === 0) {
          setError('Please select at least one industry hub');
          return false;
        }
        return true;
      case 2:
        // Check if processes are provided (either checkbox selected or otherProcesses filled)
        const hasProcesses = formData.processes.length > 0 || (formData.otherProcesses && formData.otherProcesses.trim().length > 0);
        // Check if materials are provided (either checkbox selected or otherMaterials filled)
        const hasMaterials = formData.materials.length > 0 || (formData.otherMaterials && formData.otherMaterials.trim().length > 0);

        if (!hasProcesses || !hasMaterials) {
          setError('Please select at least one process and one material, or enter them in the "Other" fields');
          return false;
        }
        return true;
      case 3:
        if (!formData.typicalJobSize || formData.typicalJobSize.length === 0) {
          setError('Please select at least one typical job size');
          return false;
        }
        if (!formData.typicalLeadTime) {
          setError('Please select a typical lead time');
          return false;
        }
        return true;
      case 5:
        if (!formData.rfqEmail) {
          setError('RFQ email is required');
          return false;
        }
        return true;
      case 6:
        if (!formData.firstName || !formData.lastName) {
          setError('First name and last name are required');
          return false;
        }
        if (!formData.role) {
          setError('Role/position is required');
          return false;
        }
        if (!formData.username) {
          setError('Username is required');
          return false;
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.username)) {
          setError('Please enter a valid email address');
          return false;
        }
        if (!formData.password) {
          setError('Password is required');
          return false;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(6)) return;

    setIsLoading(true);
    setError('');

    // Create Firebase account if not already logged in
    let userId = currentUser?.email;
    let firebaseUser = null;

    if (!currentUser || !isAuthenticated) {
      try {
        // Use username (which is now validated as email) for Firebase account creation
        const email = formData.username;

        const userCredential = await createUserWithEmailAndPassword(auth, email, formData.password);
        firebaseUser = userCredential.user;
        userId = email;

        await updateProfile(firebaseUser, {
          displayName: `${formData.firstName} ${formData.lastName}`,
        });
      } catch (err: any) {
        let errorMessage = 'An error occurred during account creation.';
        if (err.code === 'auth/email-already-in-use') {
          errorMessage = 'An account with this email already exists. Please login instead.';
        } else if (err.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address.';
        } else if (err.code === 'auth/weak-password') {
          errorMessage = 'Password is too weak. Please choose a stronger password.';
        } else if (err.message) {
          errorMessage = err.message;
        }
        setError(errorMessage);
        setIsLoading(false);
        return;
      }
    } else {
      userId = currentUser.email;
    }

    if (!userId) {
      setError('Unable to determine user ID');
      setIsLoading(false);
      return;
    }

    // Combine "other" fields into comments for AI search
    const otherComments = [
      formData.otherProcesses && `Other Processes: ${formData.otherProcesses}`,
      formData.otherMaterials && `Other Materials: ${formData.otherMaterials}`,
      formData.otherFinishes && `Other Finishes: ${formData.otherFinishes}`,
      formData.otherCertifications && `Other Certifications: ${formData.otherCertifications}`,
      formData.otherIndustries && `Other Industries: ${formData.otherIndustries}`,
      formData.industryHubs && formData.industryHubs.length > 0 && `Industry Hubs: ${formData.industryHubs.join(', ')}`,
    ]
      .filter(Boolean)
      .join('; ');

    const jobSizeSelection = formData.typicalJobSize;
    const jobSizeOrder: TypicalJobSize[] = ['PROTOTYPE', 'LOW_VOLUME', 'MEDIUM_VOLUME', 'HIGH_VOLUME'];
    const normalizedTypicalJobSize =
      Array.isArray(jobSizeSelection) && jobSizeSelection.length > 0
        ? jobSizeOrder.reduce<TypicalJobSize | null>(
          (acc, size) => (jobSizeSelection.includes(size) ? size : acc),
          null
        )
        : null;

    const submitData = {
      userId,
      onboardingMethod: formData.onboardingMethod,
      companyName: formData.companyName,
      city: formData.city,
      province: formData.province,
      provincesServed: formData.provincesServed,
      website: formData.website || null,
      companyType: formData.companyType,
      // Normalized taxonomy selections (capability IDs)
      processes: formData.processes,
      materials: formData.materials,
      finishes: formData.finishes,
      certifications: formData.certifications,
      industries: formData.industries,
      // Production profile and logistics
      typicalJobSize: normalizedTypicalJobSize,
      leadTimeMinDays: formData.leadTimeMinDays ? parseInt(formData.leadTimeMinDays, 10) : null,
      leadTimeMaxDays: formData.leadTimeMaxDays ? parseInt(formData.leadTimeMaxDays, 10) : null,
      maxPartSizeMmX: formData.maxPartSizeMmX ? parseInt(formData.maxPartSizeMmX, 10) : null,
      maxPartSizeMmY: formData.maxPartSizeMmY ? parseInt(formData.maxPartSizeMmY, 10) : null,
      maxPartSizeMmZ: formData.maxPartSizeMmZ ? parseInt(formData.maxPartSizeMmZ, 10) : null,
      // Narrative and contact
      aboutUs: formData.aboutUs || null,
      rfqEmail: formData.rfqEmail,
      phone: formData.phone || null,
      preferredContactMethod: formData.preferredContactMethod,
      otherComments: otherComments || null,
    };

    console.log('Submitting profile data:', { userId: submitData.userId, companyName: submitData.companyName });

    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let error;
        if (contentType && contentType.includes('application/json')) {
          error = await response.json();
        } else {
          error = { error: `Server error: ${response.status}` };
        }
        throw new Error(error.details || error.error || 'Failed to save profile');
      }

      // Save user account data to database
      try {
        const userSaveResponse = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: userId,
            companyName: formData.companyName,
            jobTitle: formData.role,
            phone: formData.phone || null,
            city: formData.city,
            province: formData.province,
          }),
        });

        if (!userSaveResponse.ok) {
          console.error('Failed to save user data to database');
        }
      } catch (dbError: any) {
        console.error('Error saving to database:', dbError);
      }

      // Update user auth state
      const updatedUser = {
        email: userId,
        displayName: `${formData.firstName} ${formData.lastName}`,
        role: 'both', // User is now both buyer and seller
        companyName: formData.companyName,
        city: formData.city,
        province: formData.province,
        firstName: formData.firstName,
        lastName: formData.lastName,
        jobTitle: formData.role,
      };

      // Update localStorage
      localStorage.setItem('marcan_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('marcan-auth-change'));

      // Update auth state
      login(updatedUser);

      // Clear saved registration data since registration is complete
      const savedDataKey = `seller_registration_${userId}`;
      localStorage.removeItem(savedDataKey);

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving your profile');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleArrayItem = <T,>(array: T[], item: T): T[] => {
    return array.includes(item) ? array.filter((i) => i !== item) : [...array, item];
  };

  const handleRestartRegistration = () => {
    setShowRestartConfirm(true);
  };

  const confirmRestart = () => {
    // Clear form data
    setFormData({
      onboardingMethod: 'MANUAL',
      companyName: '',
      city: '',
      province: '',
      provincesServed: [],
      companyType: null,
      website: '',
      processes: [],
      materials: [],
      finishes: [],
      otherProcesses: '',
      otherMaterials: '',
      otherFinishes: '',
      typicalJobSize: [],
      typicalLeadTime: null,
      leadTimeMinDays: '',
      leadTimeMaxDays: '',
      maxPartSizeMmX: '',
      maxPartSizeMmY: '',
      maxPartSizeMmZ: '',
      certifications: [],
      industries: [],
      otherCertifications: '',
      otherIndustries: '',
      aboutUs: '',
      rfqEmail: '',
      phone: '',
      preferredContactMethod: null,
      industryHubs: [],
      firstName: '',
      lastName: '',
      role: '',
      username: '',
      password: '',
      confirmPassword: '',
    });

    // Reset state and return to the start of Page 1 (Company Basics)
    setWizardStep(1);
    setLastCompletedStep(null);
    setError('');
    setImportUrl('');

    // Clear localStorage
    if (currentUser?.email) {
      const savedDataKey = `seller_registration_${currentUser.email}`;
      localStorage.removeItem(savedDataKey);
    }

    setShowRestartConfirm(false);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="Become a Seller" />

      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="flex items-center justify-center py-10 relative">
          <div className="glass-card p-10 rounded-3xl w-full max-w-4xl relative overflow-visible transition-all duration-500">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-marcan-red to-transparent shadow-neon"></div>

            {/* Import Loading Overlay */}
            {isImporting && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-3xl">
                <div className="w-14 h-14 rounded-full border-2 border-marcan-red/40 border-t-marcan-red animate-spin mb-4" />
                <div className="text-sm font-bold text-white mb-1 uppercase tracking-widest">
                  Analyzing your website
                </div>
                <p className="text-[11px] text-slate-400 max-w-xs text-center">
                  We&apos;re using our AI to read your site and pre-fill your supplier profile. This usually takes a minute or two.
                </p>
              </div>
            )}

            {error && (
              <div className="text-xs font-semibold mb-4 text-center text-marcan-red bg-marcan-red/10 border border-marcan-red/30 rounded-lg p-3">
                {error}
              </div>
            )}

            {/* WIZARD FORM */}
            {currentView === 'form' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <button
                    onClick={() => router.push('/signup')}
                    className="flex items-center text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider group"
                  >
                    <i className="fa-solid fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i> Change Option
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5, 6].map((step) => (
                        <div
                          key={step}
                          className={`h-1 w-6 rounded-full transition-all ${wizardStep >= step ? 'bg-marcan-red' : 'bg-white/10'}`}
                        ></div>
                      ))}
                    </div>
                    {wizardStep >= 1 && (
                      <button
                        onClick={handleRestartRegistration}
                        className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors text-xs font-bold uppercase tracking-wider group"
                        title="Restart Registration"
                      >
                        <i className="fa-solid fa-rotate-left group-hover:rotate-180 transition-transform duration-500"></i>
                        <span className="hidden sm:inline">Restart</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 1: Company Basics */}
                {wizardStep === 1 && (
                  <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                      <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">Company Basics</h2>
                      <p className="text-xs text-slate-500">Step 1 of 6</p>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Legal Company Name *</label>
                        <input
                          type="text"
                          placeholder="NorthYork Precision Ltd."
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">City *</label>
                          <input
                            type="text"
                            placeholder="Toronto"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Province *</label>
                          <select
                            value={formData.province}
                            onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-slate-400 focus:border-marcan-red outline-none"
                            required
                          >
                            <option value="">Select...</option>
                            {CANADIAN_PROVINCES.map((p) => (
                              <option key={p.code} value={p.code}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Provinces Served *</label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {CANADIAN_PROVINCES.map((p) => (
                            <label
                              key={p.code}
                              className="flex items-center gap-2 p-2 rounded bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50"
                            >
                              <input
                                type="checkbox"
                                checked={formData.provincesServed.includes(p.code)}
                                onChange={() => setFormData({
                                  ...formData,
                                  provincesServed: toggleArrayItem(formData.provincesServed, p.code)
                                })}
                                className="rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                              />
                              <span className="text-[10px] font-bold text-white uppercase">{p.code}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                          Industry Hub(s) *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {INDUSTRY_HUB_NAMES.map((hub) => (
                            <label
                              key={hub}
                              className="flex items-center gap-2 p-2 rounded bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50"
                            >
                              <input
                                type="checkbox"
                                checked={formData.industryHubs.includes(hub)}
                                onChange={() =>
                                  setFormData({
                                    ...formData,
                                    industryHubs: toggleArrayItem(formData.industryHubs, hub),
                                  })
                                }
                                className="rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                              />
                              <span className="text-[10px] font-bold text-white uppercase">{hub}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 flex items-center gap-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Company Type</label>
                          <div className="relative group inline-flex items-center cursor-pointer">
                            <i className="fa-solid fa-circle-info text-[10px] text-slate-500 group-hover:text-white transition-colors"></i>
                            <div className="hidden group-hover:block absolute right-0 mt-2 w-80 bg-black/90 border border-white/10 rounded-lg p-3 text-[10px] text-slate-200 shadow-lg z-20">
                              <div className="font-bold text-xs mb-2 text-white">How to choose your company type</div>
                              <ul className="space-y-1">
                                <li>
                                  <span className="font-semibold">1️⃣ Contract Manufacturer</span> — You manufacture parts or products for other companies based on their designs.
                                </li>
                                <li>
                                  <span className="font-semibold">2️⃣ Distributor</span> — You resell parts, materials, or components made by other manufacturers.
                                </li>
                                <li>
                                  <span className="font-semibold">3️⃣ Job Shop</span> — You focus on custom, small-batch, or one-off manufacturing work.
                                </li>
                                <li>
                                  <span className="font-semibold">4️⃣ OEM (Original Equipment Manufacturer)</span> — You design and manufacture your own products.
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                        <select
                          value={formData.companyType || ''}
                          onChange={(e) => setFormData({ ...formData, companyType: e.target.value || null })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-slate-400 focus:border-marcan-red outline-none"
                        >
                          <option value="">Select...</option>
                          {Array.isArray(capabilities.COMPANY_TYPE) && capabilities.COMPANY_TYPE.map((cap) => (
                            <option key={cap.id} value={cap.id}>{cap.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Website</label>
                        <input
                          type="url"
                          placeholder="https://www.company.com"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                        />
                      </div>
                    </div>
                    <div className="mt-8 flex justify-end">
                      <button
                        type="button"
                        onClick={saveAndNextStep}
                        className="bg-marcan-red text-white px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:shadow-neon transition-all"
                      >
                        Save and Next <i className="fa-solid fa-arrow-right ml-2"></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Core Manufacturing Capabilities */}
                {wizardStep === 2 && (
                  <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                      <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">Core Capabilities</h2>
                      <p className="text-xs text-slate-500">Step 2 of 6: Select at least one process and one material</p>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-bold text-marcan-red uppercase mb-3 block">Primary Processes *</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                          {Array.isArray(capabilities.PROCESS) && capabilities.PROCESS.map((cap) => (
                            <label
                              key={cap.id}
                              className="flex items-center gap-2 p-2 rounded bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50"
                            >
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
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Other Processes (comma-separated)</label>
                          <input
                            type="text"
                            placeholder="e.g., Custom Process 1, Custom Process 2"
                            value={formData.otherProcesses}
                            onChange={(e) => setFormData({ ...formData, otherProcesses: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">Add processes not listed above.</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-marcan-red uppercase mb-3 block">Materials *</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                          {Array.isArray(capabilities.MATERIAL) && capabilities.MATERIAL.map((cap) => (
                            <label
                              key={cap.id}
                              className="flex items-center gap-2 p-2 rounded bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50"
                            >
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
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Other Materials (comma-separated)</label>
                          <input
                            type="text"
                            placeholder="e.g., Custom Material 1, Custom Material 2"
                            value={formData.otherMaterials}
                            onChange={(e) => setFormData({ ...formData, otherMaterials: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">Add materials not listed above.</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block">Finishes (Optional)</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                          {Array.isArray(capabilities.FINISH) && capabilities.FINISH.map((cap) => (
                            <label
                              key={cap.id}
                              className="flex items-center gap-2 p-2 rounded bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50"
                            >
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
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Other Finishes (comma-separated)</label>
                          <input
                            type="text"
                            placeholder="e.g., Custom Finish 1, Custom Finish 2"
                            value={formData.otherFinishes}
                            onChange={(e) => setFormData({ ...formData, otherFinishes: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">Add finishes not listed above.</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8 flex justify-between">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="text-slate-400 hover:text-white font-bold text-sm uppercase tracking-wider px-4"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={saveAndNextStep}
                        className="bg-marcan-red text-white px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:shadow-neon transition-all"
                      >
                        Save and Next <i className="fa-solid fa-arrow-right ml-2"></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Production Profile */}
                {wizardStep === 3 && (
                  <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                      <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">Production Profile</h2>
                      <p className="text-xs text-slate-500">Step 3 of 6</p>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Typical Job Size *</label>
                        <div className="space-y-2">
                          <label className="flex items-start gap-3 p-3 rounded-lg bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50">
                            <input
                              type="checkbox"
                              checked={formData.typicalJobSize.includes('PROTOTYPE')}
                              onChange={() =>
                                setFormData({
                                  ...formData,
                                  typicalJobSize: toggleArrayItem<TypicalJobSize>(formData.typicalJobSize, 'PROTOTYPE'),
                                })
                              }
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
                              onChange={() =>
                                setFormData({
                                  ...formData,
                                  typicalJobSize: toggleArrayItem<TypicalJobSize>(formData.typicalJobSize, 'LOW_VOLUME'),
                                })
                              }
                              className="mt-0.5 rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                            />
                            <div className="text-xs text-slate-200">
                              <div className="font-semibold text-white">Low volume</div>
                              <div>Small production runs — <span className="text-slate-400">10–500 parts</span></div>
                            </div>
                          </label>
                          <label className="flex items-start gap-3 p-3 rounded-lg bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50">
                            <input
                              type="checkbox"
                              checked={formData.typicalJobSize.includes('MEDIUM_VOLUME')}
                              onChange={() =>
                                setFormData({
                                  ...formData,
                                  typicalJobSize: toggleArrayItem<TypicalJobSize>(
                                    formData.typicalJobSize,
                                    'MEDIUM_VOLUME'
                                  ),
                                })
                              }
                              className="mt-0.5 rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                            />
                            <div className="text-xs text-slate-200">
                              <div className="font-semibold text-white">Medium volume</div>
                              <div>Repeat production — <span className="text-slate-400">500–5,000 parts</span></div>
                            </div>
                          </label>
                          <label className="flex items-start gap-3 p-3 rounded-lg bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50">
                            <input
                              type="checkbox"
                              checked={formData.typicalJobSize.includes('HIGH_VOLUME')}
                              onChange={() =>
                                setFormData({
                                  ...formData,
                                  typicalJobSize: toggleArrayItem<TypicalJobSize>(formData.typicalJobSize, 'HIGH_VOLUME'),
                                })
                              }
                              className="mt-0.5 rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                            />
                            <div className="text-xs text-slate-200">
                              <div className="font-semibold text-white">High volume</div>
                              <div>Mass production — <span className="text-slate-400">5,000+ parts</span></div>
                            </div>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Typical Lead Time *</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50">
                            <input
                              type="radio"
                              name="typicalLeadTime"
                              checked={formData.typicalLeadTime === 'ONE_TWO_WEEKS'}
                              onChange={() => {
                                setFormData({
                                  ...formData,
                                  typicalLeadTime: 'ONE_TWO_WEEKS',
                                  leadTimeMinDays: '7',
                                  leadTimeMaxDays: '14',
                                });
                              }}
                              className="rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                            />
                            <span className="text-xs text-slate-200">1–2 weeks</span>
                          </label>
                          <label className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50">
                            <input
                              type="radio"
                              name="typicalLeadTime"
                              checked={formData.typicalLeadTime === 'TWO_FOUR_WEEKS'}
                              onChange={() => {
                                setFormData({
                                  ...formData,
                                  typicalLeadTime: 'TWO_FOUR_WEEKS',
                                  leadTimeMinDays: '14',
                                  leadTimeMaxDays: '30',
                                });
                              }}
                              className="rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                            />
                            <span className="text-xs text-slate-200">2–4 weeks</span>
                          </label>
                          <label className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50">
                            <input
                              type="radio"
                              name="typicalLeadTime"
                              checked={formData.typicalLeadTime === 'ONE_THREE_MONTHS'}
                              onChange={() => {
                                setFormData({
                                  ...formData,
                                  typicalLeadTime: 'ONE_THREE_MONTHS',
                                  leadTimeMinDays: '30',
                                  leadTimeMaxDays: '90',
                                });
                              }}
                              className="rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                            />
                            <span className="text-xs text-slate-200">1–3 months</span>
                          </label>
                          <label className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50">
                            <input
                              type="radio"
                              name="typicalLeadTime"
                              checked={formData.typicalLeadTime === 'THREE_PLUS_MONTHS'}
                              onChange={() => {
                                setFormData({
                                  ...formData,
                                  typicalLeadTime: 'THREE_PLUS_MONTHS',
                                  leadTimeMinDays: '90',
                                  leadTimeMaxDays: '',
                                });
                              }}
                              className="rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                            />
                            <span className="text-xs text-slate-200">3+ months</span>
                          </label>
                          <label className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50">
                            <input
                              type="radio"
                              name="typicalLeadTime"
                              checked={formData.typicalLeadTime === 'DEPENDS_ON_WORKLOAD'}
                              onChange={() => {
                                setFormData({
                                  ...formData,
                                  typicalLeadTime: 'DEPENDS_ON_WORKLOAD',
                                  leadTimeMinDays: '',
                                  leadTimeMaxDays: '',
                                });
                              }}
                              className="rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                            />
                            <span className="text-xs text-slate-200">Depends on workload</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Max Part Size (mm) - Optional</label>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-[8px] text-slate-500 mb-1 block">X</label>
                            <input
                              type="number"
                              placeholder="100"
                              value={formData.maxPartSizeMmX}
                              onChange={(e) => setFormData({ ...formData, maxPartSizeMmX: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] text-slate-500 mb-1 block">Y</label>
                            <input
                              type="number"
                              placeholder="100"
                              value={formData.maxPartSizeMmY}
                              onChange={(e) => setFormData({ ...formData, maxPartSizeMmY: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] text-slate-500 mb-1 block">Z</label>
                            <input
                              type="number"
                              placeholder="100"
                              value={formData.maxPartSizeMmZ}
                              onChange={(e) => setFormData({ ...formData, maxPartSizeMmZ: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8 flex justify-between">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="text-slate-400 hover:text-white font-bold text-sm uppercase tracking-wider px-4"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={saveAndNextStep}
                        className="bg-marcan-red text-white px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:shadow-neon transition-all"
                      >
                        Save and Next <i className="fa-solid fa-arrow-right ml-2"></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: Trust & Enrichment */}
                {wizardStep === 4 && (
                  <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                      <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">Trust & Enrichment</h2>
                      <p className="text-xs text-slate-500">Step 4 of 6: Optional</p>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block">Certifications</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                          {Array.isArray(capabilities.CERTIFICATION) && capabilities.CERTIFICATION.map((cap) => (
                            <label
                              key={cap.id}
                              className="flex items-center gap-2 p-2 rounded bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50"
                            >
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
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Other Certifications (comma-separated)</label>
                          <input
                            type="text"
                            placeholder="e.g., Custom Certification 1, Custom Certification 2"
                            value={formData.otherCertifications}
                            onChange={(e) => setFormData({ ...formData, otherCertifications: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">Add certifications not listed above.</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block">Industries Served</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                          {Array.isArray(capabilities.INDUSTRY) && capabilities.INDUSTRY.map((cap) => (
                            <label
                              key={cap.id}
                              className="flex items-center gap-2 p-2 rounded bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50"
                            >
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
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Other Industries (comma-separated)</label>
                          <input
                            type="text"
                            placeholder="e.g., Custom Industry 1, Custom Industry 2"
                            value={formData.otherIndustries}
                            onChange={(e) => setFormData({ ...formData, otherIndustries: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">Add industries not listed above.</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">About Us</label>
                        <textarea
                          rows={4}
                          placeholder="Describe your company history, mission, and specialization..."
                          value={formData.aboutUs}
                          onChange={(e) => setFormData({ ...formData, aboutUs: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                        ></textarea>
                      </div>
                    </div>
                    <div className="mt-8 flex justify-between">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="text-slate-400 hover:text-white font-bold text-sm uppercase tracking-wider px-4"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={saveAndNextStep}
                        className="bg-marcan-red text-white px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:shadow-neon transition-all"
                      >
                        Save and Next <i className="fa-solid fa-arrow-right ml-2"></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 5: Contact & RFQ Preferences */}
                {wizardStep === 5 && (
                  <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                      <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">Contact & RFQ Preferences</h2>
                      <p className="text-xs text-slate-500">Step 5 of 6</p>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">RFQ Email *</label>
                        <input
                          type="email"
                          placeholder="rfq@company.com"
                          value={formData.rfqEmail}
                          onChange={(e) => setFormData({ ...formData, rfqEmail: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Phone Number (Optional)</label>
                        <input
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={formData.phone || ''}
                          onChange={(e) => {
                            const phoneValue = e.target.value;
                            setFormData({
                              ...formData,
                              phone: phoneValue,
                              // Clear preferred contact method if phone is cleared
                              preferredContactMethod: phoneValue.trim() === '' ? null : formData.preferredContactMethod
                            });
                          }}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                        />
                      </div>
                      {formData.phone?.trim() && (
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                            Preferred Contact Method
                          </label>
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
                        </div>
                      )}
                    </div>
                    <div className="mt-8 flex justify-between">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="text-slate-400 hover:text-white font-bold text-sm uppercase tracking-wider px-4"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={saveAndNextStep}
                        className="bg-marcan-red text-white px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:shadow-neon transition-all"
                      >
                        Save and Next <i className="fa-solid fa-arrow-right ml-2"></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 6: Account Creation */}
                {wizardStep === 6 && (
                  <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                      <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">Create Your Account</h2>
                      <p className="text-xs text-slate-500">Step 6 of 6</p>
                    </div>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">First Name *</label>
                          <input
                            type="text"
                            placeholder="John"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Last Name *</label>
                          <input
                            type="text"
                            placeholder="Doe"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Role/Position in Company *</label>
                        <input
                          type="text"
                          placeholder="e.g., Procurement Manager, Owner, Operations Director"
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Username *</label>
                        <input
                          type="email"
                          placeholder="your.email@company.com"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          required
                        />
                        <p className="text-xs text-slate-500 mt-1">This will be used to log in to your account</p>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Create Password *</label>
                          <input
                            type="password"
                            placeholder="Create Password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Confirm Password *</label>
                          <input
                            type="password"
                            placeholder="Confirm Password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-8 flex justify-between">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="text-slate-400 hover:text-white font-bold text-sm uppercase tracking-wider px-4"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="bg-marcan-red text-white px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <span><i className="fa-solid fa-spinner fa-spin mr-2"></i> Creating Account...</span>
                        ) : (
                          'Complete Setup'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Restart Confirmation Modal */}
      {showRestartConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="glass-card p-8 rounded-2xl border border-red-500/30 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-exclamation-triangle text-red-400 text-2xl"></i>
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-2 uppercase">Restart Registration?</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Are you sure you want to restart registration? All your progress will be lost and you'll need to start from the beginning.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowRestartConfirm(false)}
                className="flex-1 bg-white/5 border border-white/10 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmRestart}
                className="flex-1 bg-red-500 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-red-600 hover:shadow-neon transition-all"
              >
                Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
