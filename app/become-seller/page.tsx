'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/contexts/I18nContext';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { INDUSTRY_HUBS_EN } from '@/lib/industryHubNormalize';
import { validateWebsiteUrl } from '@/lib/websiteUrl';

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

const CANADIAN_PROVINCES = [
  { code: 'ON', name: 'Ontario', frName: 'Ontario' },
  { code: 'QC', name: 'Quebec', frName: 'Québec' },
  { code: 'BC', name: 'British Columbia', frName: 'Colombie-Britannique' },
  { code: 'AB', name: 'Alberta', frName: 'Alberta' },
  { code: 'MB', name: 'Manitoba', frName: 'Manitoba' },
  { code: 'SK', name: 'Saskatchewan', frName: 'Saskatchewan' },
  { code: 'NS', name: 'Nova Scotia', frName: 'Nouvelle-Écosse' },
  { code: 'NB', name: 'New Brunswick', frName: 'Nouveau-Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador', frName: 'Terre-Neuve-et-Labrador' },
  { code: 'PE', name: 'Prince Edward Island', frName: 'Île-du-Prince-Édouard' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'YT', name: 'Yukon' },
  { code: 'NU', name: 'Nunavut' },
];

const PAGE2_PRIMARY_PROCESS_NAMES = [
  'Assembly',
  'Casting',
  'CNC Machining',
  'Extrusion',
  'Fabrication',
  'Forging',
  'Molding',
  'Stamping',
  'Tooling',
  'Welding',
  'Grinding',
  'Pressing',
];

const PAGE2_MATERIAL_NAMES = [
  'Aluminum',
  'Brass',
  'Ceramic',
  'Composite',
  'Copper',
  'Plastic',
  'Rubber',
  'Stainless Steel',
  'Steel',
  'Titanium',
  'Carbon Fiber',
  'Inconel',
];

export default function BecomeSupplierPage() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const isFr = lang === 'fr';
  const { login, user: currentUser, isAuthenticated, isMounted } = useAuth();
  const [currentView, setCurrentView] = useState<View>('form');
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [lastCompletedStep, setLastCompletedStep] = useState<WizardStep | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [error, setError] = useState('');
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGeneralSupplier, setIsGeneralSupplier] = useState(false);
  const INDUSTRY_HUB_NAMES = isFr
    ? [
      'Usinage de précision',
      'Fonderies et moulage',
      'Finition de surface',
      'Outillage et moules',
      'Automatisation',
      'Fabrication additive',
      'Support manufacturier',
    ]
    : Array.from(INDUSTRY_HUBS_EN);
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
  const processByName = new Map(capabilities.PROCESS.map((cap) => [cap.name.toLowerCase(), cap]));
  const materialByName = new Map(capabilities.MATERIAL.map((cap) => [cap.name.toLowerCase(), cap]));
  const page2ProcessCapabilities = PAGE2_PRIMARY_PROCESS_NAMES
    .map((name) => processByName.get(name.toLowerCase()))
    .filter((cap): cap is Capability => Boolean(cap));
  const page2MaterialCapabilities = PAGE2_MATERIAL_NAMES
    .map((name) => materialByName.get(name.toLowerCase()))
    .filter((cap): cap is Capability => Boolean(cap));
  const matchedProcessNames = new Set(page2ProcessCapabilities.map((cap) => cap.name.toLowerCase()));
  const matchedMaterialNames = new Set(page2MaterialCapabilities.map((cap) => cap.name.toLowerCase()));
  const page2MissingProcessNames = PAGE2_PRIMARY_PROCESS_NAMES.filter((name) => !matchedProcessNames.has(name.toLowerCase()));
  const page2MissingMaterialNames = PAGE2_MATERIAL_NAMES.filter((name) => !matchedMaterialNames.has(name.toLowerCase()));

  // Form state
  const [formData, setFormData] = useState({
    // Step 0
    onboardingMethod: null as OnboardingMethod | null,
    // Step 1
    companyName: '',
    streetAddress: '',
    city: '',
    province: '',
    businessNumber: '',
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
    industriesServed: [] as string[],
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
    email: '',
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
      const savedDataKey = `supplier_registration_${currentUser.email}`;
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
              industriesServed: Array.isArray(parsed.formData.industriesServed) ? parsed.formData.industriesServed : [],
              typicalJobSize: Array.isArray(parsed.formData.typicalJobSize)
                ? parsed.formData.typicalJobSize
                : parsed.formData.typicalJobSize
                  ? [parsed.formData.typicalJobSize]
                  : [],
              phone: parsed.formData.phone || '',
              streetAddress: parsed.formData.streetAddress || '',
              businessNumber: parsed.formData.businessNumber || '',
            };
            setFormData(loadedFormData);
          }
          if (parsed.lastCompletedStep !== undefined && parsed.lastCompletedStep !== null) {
            setLastCompletedStep(parsed.lastCompletedStep);
          }
          // Always use the standard supplier form
          setIsGeneralSupplier(false);
        } catch (err) {
          console.error('Error loading saved form data:', err);
        }
      }
    }
  }, [isMounted, currentUser]);

  // Save form data to localStorage whenever it changes (debounced)
  useEffect(() => {
    if (isMounted && currentUser?.email) {
      const savedDataKey = `supplier_registration_${currentUser.email}`;
      const dataToSave = {
        formData,
        lastCompletedStep,
        wizardStep,
        isGeneralSupplier,
      };
      // Debounce the save to avoid too many writes
      const timeoutId = setTimeout(() => {
        localStorage.setItem(savedDataKey, JSON.stringify(dataToSave));
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [formData, lastCompletedStep, wizardStep, isGeneralSupplier, isMounted, currentUser]);

  const [hasProcessedQueryParams, setHasProcessedQueryParams] = useState(false);

  // Initialize view based on query params (start=import or start=manual from signup)
  useEffect(() => {
    if (!isMounted || hasProcessedQueryParams) return;
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const start = params.get('start');
    const urlFromQuery = params.get('url');
    const requestedStepParam = params.get('step');
    const requestedStep = requestedStepParam ? Number(requestedStepParam) : NaN;
    const companyFromQuery = params.get('company');

    if (start === 'import' && urlFromQuery) {
      setCurrentView('form');
      setWizardStep(1);
      setIsImporting(true);
      setHasProcessedQueryParams(true);

      if (companyFromQuery) {
        setFormData((prev) => ({
          ...prev,
          companyName: prev.companyName || companyFromQuery,
        }));
      }

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
            streetAddress: importedData.streetAddress || prev.streetAddress,
            city: importedData.city || prev.city,
            province: importedData.province || prev.province,
            businessNumber: importedData.businessNumber || prev.businessNumber,
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
            industriesServed: Array.isArray(importedData.industriesServed) ? importedData.industriesServed : prev.industriesServed,
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
      if (companyFromQuery) {
        setFormData((prev) => ({
          ...prev,
          companyName: prev.companyName || companyFromQuery,
        }));
      }
    } else if (!Number.isNaN(requestedStep) && requestedStep >= 0 && requestedStep <= 6) {
      // Deep-link into a specific wizard step (e.g., ?step=0 for Shop Profile)
      setCurrentView('form');
      setWizardStep(requestedStep as WizardStep);
      setHasProcessedQueryParams(true);
      if (companyFromQuery) {
        setFormData((prev) => ({
          ...prev,
          companyName: prev.companyName || companyFromQuery,
        }));
      }
    }
  }, [isMounted, hasProcessedQueryParams]);

  // Redirect if user already has a supplier profile
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
          if (
            profile &&
            true
          ) {
            // User already has a supplier profile, redirect to my account
            router.replace('/my-account');
          }
        })
        .catch((err) => {
          console.error('Error checking supplier profile:', err);
          // On error, allow them to proceed (they might not have a profile yet)
        });
    }
  }, [isMounted, isAuthenticated, currentUser?.email, router]);

  const handleImportWebsite = async () => {
    if (!importUrl.trim()) {
      setError(t('becomeSupplier.errors.enterWebsiteUrl'));
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
        streetAddress: importedData.streetAddress || formData.streetAddress,
        city: importedData.city || formData.city,
        province: importedData.province || formData.province,
        businessNumber: importedData.businessNumber || formData.businessNumber,
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
          setError(t('becomeSupplier.errors.enterWebsiteUrl'));
          return false;
        }
        if (!formData.onboardingMethod) {
          setError(t('becomeSupplier.errors.selectOnboardingMethod'));
          return false;
        }
        return true;
      case 1:
        // Always require basic company location info
        if (!formData.companyName || !formData.streetAddress || !formData.city || !formData.province) {
          setError(t('becomeSupplier.errors.basicCompanyRequired'));
          return false;
        }
        // Only enforce richer company profile fields on the standard listing
        if (!isGeneralSupplier) {
          if (formData.provincesServed.length === 0) {
            setError(t('becomeSupplier.errors.selectProvinceServed'));
            return false;
          }
          if (!formData.industriesServed || formData.industriesServed.length === 0) {
            setError(t('becomeSupplier.errors.selectIndustryHub'));
            return false;
          }
        }
        return true;
      case 2:
        // Core capabilities are required for the standard listing, but optional for the general form
        if (!isGeneralSupplier) {
          const hasProcesses = formData.processes.length > 0 || (formData.otherProcesses && formData.otherProcesses.trim().length > 0);
          const hasMaterials = formData.materials.length > 0 || (formData.otherMaterials && formData.otherMaterials.trim().length > 0);

          if (!hasProcesses || !hasMaterials) {
            setError(t('becomeSupplier.errors.selectProcessAndMaterial'));
            return false;
          }
        }
        return true;
      case 3:
        // Production profile is only required for the standard listing
        if (!isGeneralSupplier) {
          if (!formData.typicalJobSize || formData.typicalJobSize.length === 0) {
            setError(t('becomeSupplier.errors.selectTypicalJobSize'));
            return false;
          }
          if (!formData.typicalLeadTime) {
            setError(t('becomeSupplier.errors.selectTypicalLeadTime'));
            return false;
          }
        }
        return true;
      case 5:
        if (!formData.rfqEmail) {
          setError(t('becomeSupplier.errors.rfqEmailRequired'));
          return false;
        }
        return true;
      case 6:
        if (!formData.firstName || !formData.lastName) {
          setError(t('becomeSupplier.errors.firstLastRequired'));
          return false;
        }
        if (!formData.role) {
          setError(t('becomeSupplier.errors.roleRequired'));
          return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) {
          setError(t('becomeSupplier.errors.emailRequired'));
          return false;
        }
        // Validate email format
        if (!emailRegex.test(formData.email)) {
          setError(t('becomeSupplier.errors.emailInvalid'));
          return false;
        }
        if (!formData.password) {
          setError(t('becomeSupplier.errors.passwordRequired'));
          return false;
        }
        if (formData.password.length < 6) {
          setError(t('becomeSupplier.errors.passwordLength'));
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError(t('becomeSupplier.errors.passwordsNoMatch'));
          return false;
        }
        if (formData.website.trim()) {
          const websiteCheck = validateWebsiteUrl(formData.website);
          if (!websiteCheck.valid) {
            setError(t('signup.joinSupplier.invalidUrl'));
            return false;
          }
        }
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(6)) return;
    const isStorefrontSignup = wizardStep === 0;

    setIsLoading(true);
    setError('');

    // Create Firebase account if not already logged in
    let userId = currentUser?.email;
    let firebaseUser = null;

    if (!currentUser || !isAuthenticated) {
      try {
        // Use email for Firebase account creation
        const email = formData.email;

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
      setError(t('becomeSupplier.errors.unableDetermineUserId'));
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
      formData.industriesServed && formData.industriesServed.length > 0 && `Industry Hubs: ${formData.industriesServed.join(', ')}`,
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

    const websiteCheck = validateWebsiteUrl(formData.website);
    const websiteForApi = websiteCheck.valid ? websiteCheck.normalized : null;
    if (!websiteCheck.valid) {
      setError(t('signup.joinSupplier.invalidUrl'));
      setIsLoading(false);
      return;
    }

    const submitData = {
      userId,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      onboardingMethod: formData.onboardingMethod,
      companyName: formData.companyName,
      streetAddress: formData.streetAddress,
      city: formData.city,
      province: formData.province,
      businessNumber: formData.businessNumber || null,
      provincesServed: formData.provincesServed,
      website: websiteForApi,
      companyType: formData.companyType,
      jobTitle: formData.role,
      // Storefront signups should not appear in the Network Directory.
      // Normalized taxonomy selections (capability IDs)
      processes: formData.processes,
      materials: formData.materials,
      finishes: formData.finishes,
      certifications: formData.certifications,
      industries: formData.industries,
      // Production profile and logistics
      typicalJobSize: normalizedTypicalJobSize,
      typicalLeadTime: formData.typicalLeadTime,
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
      industriesServed: formData.industriesServed || [],
      otherProcesses: formData.otherProcesses || null,
      otherMaterials: formData.otherMaterials || null,
      otherFinishes: formData.otherFinishes || null,
      otherCertifications: formData.otherCertifications || null,
      otherIndustries: formData.otherIndustries || null,
      otherComments: otherComments || null,
    };

    console.log('Submitting profile data:', { userId: submitData.userId, companyName: submitData.companyName });

    try {
      const profileEndpoint = isStorefrontSignup ? '/api/storefront-profile' : '/api/profiles';
      const response = await fetch(profileEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isStorefrontSignup
            ? {
              userId,
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              companyName: formData.companyName,
              role: formData.role,
              streetAddress: formData.streetAddress,
              city: formData.city,
              province: formData.province,
              businessNumber: formData.businessNumber || null,
              website: websiteForApi,
              phone: formData.phone || null,
              aboutUs: formData.aboutUs || null,
            }
            : submitData
        ),
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
            userId: userId, // email is used as userId for Firebase compatibility
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
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
        role: isStorefrontSignup ? 'seller' : 'supplier',
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
      const savedDataKey = `supplier_registration_${userId}`;
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

  const parseCommaSeparated = (value: string): string[] =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const toggleCommaSeparatedItem = (value: string, item: string): string => {
    const currentItems = parseCommaSeparated(value);
    return currentItems.includes(item)
      ? currentItems.filter((current) => current !== item).join(', ')
      : [...currentItems, item].join(', ');
  };

  const hasCommaSeparatedItem = (value: string, item: string): boolean => {
    return parseCommaSeparated(value).includes(item);
  };

  const handleRestartRegistration = () => {
    setShowRestartConfirm(true);
  };

  const confirmRestart = () => {
    // Clear form data
    setFormData({
      onboardingMethod: 'MANUAL',
      companyName: '',
      streetAddress: '',
      city: '',
      province: '',
      businessNumber: '',
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
      industriesServed: [],
      firstName: '',
      lastName: '',
      role: '',
      email: '',
      password: '',
      confirmPassword: '',
    });

    // Reset state and return to the start of Page 1 (Company Basics)
    setWizardStep(1);
    setLastCompletedStep(null);
    setError('');
    setImportUrl('');
    setIsGeneralSupplier(false);

    // Clear localStorage
    if (currentUser?.email) {
      const savedDataKey = `supplier_registration_${currentUser.email}`;
      localStorage.removeItem(savedDataKey);
    }

    setShowRestartConfirm(false);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header
        breadcrumb={
          wizardStep === 0 ? 'Industrial Storefront Profile Signup' : t('becomeSupplier.breadcrumb')
        }
      />

      <div
        className={`flex-1 relative ${wizardStep === 0 ? 'overflow-hidden p-4' : 'overflow-y-auto p-8'}`}
      >
        <div className={`flex items-center justify-center relative ${wizardStep === 0 ? 'py-4' : 'py-10'}`}>
          <div
            className={`glass-card rounded-3xl w-full relative overflow-visible transition-all duration-500 ${wizardStep === 0 ? 'p-6 max-w-6xl' : 'p-10 max-w-4xl'
              }`}
          >
            <div
              className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${wizardStep === 0 ? 'via-orange-500' : 'via-marcan-red'
                } to-transparent ${wizardStep === 0
                  ? 'shadow-[0_0_10px_rgba(249,115,22,0.5)]'
                  : 'shadow-neon'
                }`}
            />

            {/* Import Loading Overlay */}
            {isImporting && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-3xl">
                <div className="w-14 h-14 rounded-full border-2 border-marcan-red/40 border-t-marcan-red animate-spin mb-4" />
                <div className="text-sm font-bold text-white mb-1 uppercase tracking-widest">
                  {t('becomeSupplier.import.analyzingTitle')}
                </div>
                <p className="text-[11px] text-slate-400 max-w-xs text-center">
                  {t('becomeSupplier.import.analyzingBody')}
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
                {wizardStep !== 0 && (
                  <div className="flex justify-between items-center mb-8">
                    <button
                      onClick={() => router.push('/signup')}
                      className="flex items-center text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider group"
                    >
                      <i className="fa-solid fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i>{' '}
                      {t('becomeSupplier.changeOption')}
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
                          title={t('becomeSupplier.restart')}
                        >
                          <i className="fa-solid fa-rotate-left group-hover:rotate-180 transition-transform duration-500"></i>
                          <span className="hidden sm:inline">{t('becomeSupplier.restart')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 1: Company Basics */}
                {wizardStep === 1 && (
                  <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                      <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">{t('becomeSupplier.companyBasics.title')}</h2>
                      <p className="text-xs text-slate-500">{t('becomeSupplier.companyBasics.step')}</p>
                    </div>
                    <div className="space-y-6">
                      {/* Form type selector removed: Standard supplier form only */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('becomeSupplier.companyBasics.legalCompanyName')} *</label>
                        <input
                          type="text"
                          placeholder={isFr ? "XYZ Précision Ltée." : "XYZ Precision Ltd."}
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('becomeSupplier.companyBasics.streetAddress')} *</label>
                        <input
                          type="text"
                          placeholder={isFr ? "123, rue Principale" : "123 Main Street"}
                          value={formData.streetAddress}
                          onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('becomeSupplier.companyBasics.city')} *</label>
                          <input
                            type="text"
                            placeholder={isFr ? "Toronto" : "Toronto"}
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('becomeSupplier.companyBasics.province')} *</label>
                          <select
                            value={formData.province}
                            onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-slate-400 focus:border-marcan-red outline-none"
                            required
                          >
                            <option value="">{t('becomeSupplier.companyBasics.select')}</option>
                            {CANADIAN_PROVINCES.map((p) => (
                              <option key={p.code} value={p.code}>{isFr ? (p as any).frName ?? p.name : p.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('becomeSupplier.companyBasics.businessNumber')}</label>
                        <input
                          type="text"
                          placeholder="123456789"
                          value={formData.businessNumber}
                          onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('becomeSupplier.companyBasics.provincesServed')} *</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
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
                          {t('becomeSupplier.companyBasics.industriesServed')} *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {INDUSTRY_HUB_NAMES.map((hub) => (
                            <label
                              key={hub}
                              className="flex items-center gap-2 p-2 rounded bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50"
                            >
                              <input
                                type="checkbox"
                                checked={formData.industriesServed.includes(hub)}
                                onChange={() =>
                                  setFormData({
                                    ...formData,
                                    industriesServed: toggleArrayItem(formData.industriesServed, hub),
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
                          <label className="text-[10px] font-bold text-slate-400 uppercase">{t('becomeSupplier.companyBasics.companyType')}</label>
                          <div className="relative group inline-flex items-center cursor-pointer">
                            <i className="fa-solid fa-circle-info text-[10px] text-slate-500 group-hover:text-white transition-colors"></i>
                            <div className="hidden group-hover:block absolute right-0 mt-2 w-80 bg-black/90 border border-white/10 rounded-lg p-3 text-[10px] text-slate-200 shadow-lg z-20">
                              <div className="font-bold text-xs mb-2 text-white">{t('becomeSupplier.companyTypeHelp.title')}</div>
                              <ul className="space-y-1">
                                <li>
                                  <span className="font-semibold">1️⃣ {isFr ? 'Fabricant sous contrat' : 'Contract Manufacturer'}</span> — {t('becomeSupplier.companyTypeHelp.contractManufacturer').split(' — ')[1] ?? t('becomeSupplier.companyTypeHelp.contractManufacturer')}
                                </li>
                                <li>
                                  <span className="font-semibold">2️⃣ {isFr ? 'Distributeur' : 'Distributor'}</span> — {t('becomeSupplier.companyTypeHelp.distributor').split(' — ')[1] ?? t('becomeSupplier.companyTypeHelp.distributor')}
                                </li>
                                <li>
                                  <span className="font-semibold">3️⃣ {isFr ? 'Atelier d’usinage' : 'Job Shop'}</span> — {t('becomeSupplier.companyTypeHelp.jobShop').split(' — ')[1] ?? t('becomeSupplier.companyTypeHelp.jobShop')}
                                </li>
                                <li>
                                  <span className="font-semibold">4️⃣ OEM</span> — {t('becomeSupplier.companyTypeHelp.oem').split(' — ')[1] ?? t('becomeSupplier.companyTypeHelp.oem')}
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
                          <option value="">{t('becomeSupplier.companyBasics.select')}</option>
                          {Array.isArray(capabilities.COMPANY_TYPE) && capabilities.COMPANY_TYPE.map((cap) => (
                            <option key={cap.id} value={cap.id}>{cap.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('becomeSupplier.companyBasics.website')}</label>
                        <input
                          type="url"
                          placeholder={isFr ? "https://www.entreprise.com" : "https://www.company.com"}
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
                        {t('becomeSupplier.companyBasics.saveAndNext')} <i className="fa-solid fa-arrow-right ml-2"></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Core Manufacturing Capabilities */}
                {wizardStep === 2 && (
                  <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                      <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">{t('becomeSupplier.coreCapabilities.title')}</h2>
                      <p className="text-xs text-slate-500">{t('becomeSupplier.coreCapabilities.step')}</p>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block">{t('becomeSupplier.coreCapabilities.primaryProcesses')} *</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                          {page2ProcessCapabilities.map((cap) => (
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
                          {page2MissingProcessNames.map((processName) => (
                            <label
                              key={`missing-process-${processName}`}
                              className="flex items-center gap-2 p-2 rounded bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50"
                            >
                              <input
                                type="checkbox"
                                checked={hasCommaSeparatedItem(formData.otherProcesses, processName)}
                                onChange={() => setFormData({
                                  ...formData,
                                  otherProcesses: toggleCommaSeparatedItem(formData.otherProcesses, processName)
                                })}
                                className="rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                              />
                              <span className="text-[10px] font-bold text-white uppercase">{processName}</span>
                            </label>
                          ))}
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('becomeSupplier.coreCapabilities.otherProcesses')}</label>
                          <input
                            type="text"
                            placeholder="e.g., Custom Process 1, Custom Process 2"
                            value={formData.otherProcesses}
                            onChange={(e) => setFormData({ ...formData, otherProcesses: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">{t('becomeSupplier.coreCapabilities.addProcessesHelp')}</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block">{t('becomeSupplier.coreCapabilities.materials')} *</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                          {page2MaterialCapabilities.map((cap) => (
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
                          {page2MissingMaterialNames.map((materialName) => (
                            <label
                              key={`missing-material-${materialName}`}
                              className="flex items-center gap-2 p-2 rounded bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50"
                            >
                              <input
                                type="checkbox"
                                checked={hasCommaSeparatedItem(formData.otherMaterials, materialName)}
                                onChange={() => setFormData({
                                  ...formData,
                                  otherMaterials: toggleCommaSeparatedItem(formData.otherMaterials, materialName)
                                })}
                                className="rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                              />
                              <span className="text-[10px] font-bold text-white uppercase">{materialName}</span>
                            </label>
                          ))}
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('becomeSupplier.coreCapabilities.otherMaterials')}</label>
                          <input
                            type="text"
                            placeholder="e.g., Custom Material 1, Custom Material 2"
                            value={formData.otherMaterials}
                            onChange={(e) => setFormData({ ...formData, otherMaterials: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">{t('becomeSupplier.coreCapabilities.addMaterialsHelp')}</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block">{t('becomeSupplier.coreCapabilities.finishesOptional')}</label>
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
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('becomeSupplier.coreCapabilities.otherFinishes')}</label>
                          <input
                            type="text"
                            placeholder="e.g., Custom Finish 1, Custom Finish 2"
                            value={formData.otherFinishes}
                            onChange={(e) => setFormData({ ...formData, otherFinishes: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">{t('becomeSupplier.coreCapabilities.addFinishesHelp')}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8 flex justify-between">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="text-slate-400 hover:text-white font-bold text-sm uppercase tracking-wider px-4"
                      >
                        {t('becomeSupplier.coreCapabilities.back')}
                      </button>
                      <button
                        type="button"
                        onClick={saveAndNextStep}
                        className="bg-marcan-red text-white px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:shadow-neon transition-all"
                      >
                        {t('becomeSupplier.companyBasics.saveAndNext')} <i className="fa-solid fa-arrow-right ml-2"></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Production Profile */}
                {wizardStep === 3 && (
                  <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                      <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">{t('becomeSupplier.productionProfile.title')}</h2>
                      <p className="text-xs text-slate-500">{t('becomeSupplier.productionProfile.step')}</p>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">{t('becomeSupplier.productionProfile.typicalJobSize')} *</label>
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
                              <div className="font-semibold text-white">{t('becomeSupplier.productionProfile.prototype')}</div>
                              <div>{t('becomeSupplier.productionProfile.prototypeDesc')}</div>
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
                              <div className="font-semibold text-white">{t('becomeSupplier.productionProfile.lowVolume')}</div>
                              <div>{t('becomeSupplier.productionProfile.lowVolumeDesc')}</div>
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
                              <div className="font-semibold text-white">{t('becomeSupplier.productionProfile.mediumVolume')}</div>
                              <div>{t('becomeSupplier.productionProfile.mediumVolumeDesc')}</div>
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
                              <div className="font-semibold text-white">{t('becomeSupplier.productionProfile.highVolume')}</div>
                              <div>{t('becomeSupplier.productionProfile.highVolumeDesc')}</div>
                            </div>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">{t('becomeSupplier.productionProfile.typicalLeadTime')} *</label>
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
                            <span className="text-xs text-slate-200">{t('becomeSupplier.productionProfile.oneTwoWeeks')}</span>
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
                            <span className="text-xs text-slate-200">{t('becomeSupplier.productionProfile.twoFourWeeks')}</span>
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
                            <span className="text-xs text-slate-200">{t('becomeSupplier.productionProfile.oneThreeMonths')}</span>
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
                            <span className="text-xs text-slate-200">{t('becomeSupplier.productionProfile.threePlusMonths')}</span>
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
                            <span className="text-xs text-slate-200">{t('becomeSupplier.productionProfile.depends')}</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('becomeSupplier.productionProfile.maxPartSizeOptional')}</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                        {t('becomeSupplier.coreCapabilities.back')}
                      </button>
                      <button
                        type="button"
                        onClick={saveAndNextStep}
                        className="bg-marcan-red text-white px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:shadow-neon transition-all"
                      >
                        {t('becomeSupplier.companyBasics.saveAndNext')} <i className="fa-solid fa-arrow-right ml-2"></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: Trust & Enrichment */}
                {wizardStep === 4 && (
                  <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                      <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">{t('becomeSupplier.trustEnrichment.title')}</h2>
                      <p className="text-xs text-slate-500">{t('becomeSupplier.trustEnrichment.step')}</p>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block">{t('becomeSupplier.trustEnrichment.certifications')}</label>
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
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('becomeSupplier.trustEnrichment.otherCertifications')}</label>
                          <input
                            type="text"
                            placeholder="e.g., Custom Certification 1, Custom Certification 2"
                            value={formData.otherCertifications}
                            onChange={(e) => setFormData({ ...formData, otherCertifications: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">{t('becomeSupplier.trustEnrichment.addCertificationsHelp')}</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block">{t('becomeSupplier.trustEnrichment.industriesServed')}</label>
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
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('becomeSupplier.trustEnrichment.otherIndustries')}</label>
                          <input
                            type="text"
                            placeholder="e.g., Custom Industry 1, Custom Industry 2"
                            value={formData.otherIndustries}
                            onChange={(e) => setFormData({ ...formData, otherIndustries: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">{t('becomeSupplier.trustEnrichment.addIndustriesHelp')}</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('becomeSupplier.trustEnrichment.aboutUs')}</label>
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
                        {t('becomeSupplier.coreCapabilities.back')}
                      </button>
                      <button
                        type="button"
                        onClick={saveAndNextStep}
                        className="bg-marcan-red text-white px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:shadow-neon transition-all"
                      >
                        {t('becomeSupplier.companyBasics.saveAndNext')} <i className="fa-solid fa-arrow-right ml-2"></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 5: Contact & RFQ Preferences */}
                {wizardStep === 5 && (
                  <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                      <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">{t('becomeSupplier.contactRfq.title')}</h2>
                      <p className="text-xs text-slate-500">{t('becomeSupplier.contactRfq.step')}</p>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('becomeSupplier.contactRfq.rfqEmail')} *</label>
                        <input
                          type="email"
                          placeholder={isFr ? "rfq@entreprise.com" : "rfq@company.com"}
                          value={formData.rfqEmail}
                          onChange={(e) => setFormData({ ...formData, rfqEmail: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('becomeSupplier.contactRfq.phoneOptional')}</label>
                        <input
                          type="tel"
                          placeholder={isFr ? "+1 (555) 000-0000" : "+1 (555) 000-0000"}
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
                            {t('becomeSupplier.contactRfq.preferredContactMethod')}
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
                              <div className="text-white font-bold text-sm uppercase">{t('becomeSupplier.contactRfq.email')}</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, preferredContactMethod: 'PHONE' })}
                              className={`p-4 rounded-lg border-2 transition-all text-left ${formData.preferredContactMethod === 'PHONE'
                                ? 'border-marcan-red bg-marcan-red/10'
                                : 'border-white/10 hover:border-marcan-red/50'
                                }`}
                            >
                              <div className="text-white font-bold text-sm uppercase">{t('becomeSupplier.contactRfq.phone')}</div>
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
                        {t('becomeSupplier.coreCapabilities.back')}
                      </button>
                      <button
                        type="button"
                        onClick={saveAndNextStep}
                        className="bg-marcan-red text-white px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:shadow-neon transition-all"
                      >
                        {t('becomeSupplier.companyBasics.saveAndNext')} <i className="fa-solid fa-arrow-right ml-2"></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 6: Shop Profile Sign Up (temporarily hidden; moved out of supplier step numbering) */}
                {wizardStep === 0 && (
                  <div className="max-w-5xl mx-auto py-0 pt-0">
                    <div className="mb-3">
                      <button
                        type="button"
                        onClick={() => router.push('/signup')}
                        className="text-xs text-slate-500 hover:text-white font-bold uppercase tracking-widest flex items-center gap-2"
                      >
                        <i className="fa-solid fa-arrow-left"></i>
                        {t('becomeSupplier.changeOption')}
                      </button>
                    </div>
                    <div className="text-center mb-6">
                      <h2 className="font-heading text-3xl font-black text-white uppercase tracking-tight mb-1">
                        Create Your Storefront Profile
                      </h2>
                    </div>

                    <form className="glass-card p-6 md:p-7 rounded-3xl border border-white/5 relative overflow-hidden">
                      {/* Decorative glow */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

                      <div className="grid md:grid-cols-2 gap-6 md:gap-8 relative z-10">
                        {/* Column 1: Company Details */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                            <i className="fa-solid fa-building text-orange-400" />
                            <h3 className="font-bold text-white uppercase tracking-wide text-sm">
                              Company Details
                            </h3>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                              Legal Company Name
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Acme Manufacturing Ltd."
                              value={formData.companyName}
                              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.3)] outline-none transition-all placeholder:text-slate-600"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                              Street Address
                            </label>
                            <input
                              type="text"
                              placeholder="123 Industrial Way"
                              value={formData.streetAddress}
                              onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.3)] outline-none transition-all placeholder:text-slate-600"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                                City
                              </label>
                              <input
                                type="text"
                                placeholder="Toronto"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.3)] outline-none transition-all placeholder:text-slate-600"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                                Province
                              </label>
                              <div className="relative">
                                <select
                                  value={formData.province}
                                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-slate-400 focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.3)] outline-none transition-all appearance-none cursor-pointer"
                                >
                                  <option value="" disabled>
                                    Select
                                  </option>
                                  {CANADIAN_PROVINCES.map((p) => (
                                    <option key={p.code} value={p.code}>
                                      {isFr ? (p.frName || p.name) : p.name} ({p.code})
                                    </option>
                                  ))}
                                </select>
                                <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs" />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                              {t('becomeSupplier.companyBasics.website')}
                            </label>
                            <input
                              type="url"
                              inputMode="url"
                              autoComplete="url"
                              placeholder={t('signup.joinSupplier.websiteUrlPlaceholder')}
                              value={formData.website}
                              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.3)] outline-none transition-all placeholder:text-slate-600"
                            />
                          </div>
                        </div>

                        {/* Column 2: Account Details */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                            <i className="fa-solid fa-user-shield text-orange-400" />
                            <h3 className="font-bold text-white uppercase tracking-wide text-sm">
                              Account Manager
                            </h3>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                                First Name
                              </label>
                              <input
                                type="text"
                                placeholder="Jane"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.3)] outline-none transition-all placeholder:text-slate-600"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                                Last Name
                              </label>
                              <input
                                type="text"
                                placeholder="Doe"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.3)] outline-none transition-all placeholder:text-slate-600"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                              Role in Company
                            </label>
                            <input
                              type="text"
                              placeholder="Owner / Manager"
                              value={formData.role}
                              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.3)] outline-none transition-all placeholder:text-slate-600"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                              Company Email
                            </label>
                            <input
                              type="email"
                              placeholder="jane@acmemfg.ca"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.3)] outline-none transition-all placeholder:text-slate-600"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                                Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="••••••••"
                                  value={formData.password}
                                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-white focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.3)] outline-none transition-all placeholder:text-slate-600"
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                  aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                                Confirm Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="••••••••"
                                  value={formData.confirmPassword}
                                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-white focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.3)] outline-none transition-all placeholder:text-slate-600"
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                >
                                  <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:flex-nowrap items-center justify-between gap-4 relative z-10">
                        <p className="text-[11px] text-slate-500 sm:whitespace-nowrap">
                          By creating an industrial storefront profile, you agree to our{' '}
                          <a href="/terms" className="text-orange-400 hover:text-orange-300 underline underline-offset-4">
                            Terms of Service
                          </a>
                          .
                        </p>

                        <div className="flex w-full sm:w-auto gap-4">
                          <button
                            type="button"
                            onClick={() => {
                              setError('');
                              if (!formData.companyName || !formData.streetAddress || !formData.city || !formData.province) {
                                setError(t('becomeSupplier.errors.basicCompanyRequired'));
                                return;
                              }
                              if (!validateStep(6)) return;
                              handleSubmit();
                            }}
                            className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-sm shadow-[0_0_15px_rgba(249,115,22,0.4)] hover:shadow-[0_0_25px_rgba(249,115,22,0.6)] hover:scale-[1.03] transition-all duration-300 whitespace-nowrap"
                          >
                            Create Profile <i className="fa-solid fa-arrow-right ml-2"></i>
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}

                {/* Step 6: Account Creation */}
                {wizardStep === 6 && (
                  <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                      <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">{t('becomeSupplier.account.title')}</h2>
                      <p className="text-xs text-slate-500">{t('becomeSupplier.account.step')}</p>
                    </div>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('becomeSupplier.account.firstName')} *</label>
                          <input
                            type="text"
                            placeholder={isFr ? "Jean" : "John"}
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('becomeSupplier.account.lastName')} *</label>
                          <input
                            type="text"
                            placeholder={isFr ? "Dupont" : "Doe"}
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('becomeSupplier.account.role')} *</label>
                        <input
                          type="text"
                          placeholder={isFr ? "ex. : Responsable achats, Propriétaire, Directeur des opérations" : "e.g., Procurement Manager, Owner, Operations Director"}
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('becomeSupplier.account.email')} *</label>
                        <input
                          type="email"
                          placeholder={isFr ? "votre.courriel@entreprise.com" : "your.email@company.com"}
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          required
                        />
                        <p className="text-xs text-slate-500 mt-1">This will be used for authentication and account recovery</p>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('becomeSupplier.account.createPassword')} *</label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              placeholder={isFr ? "Créer un mot de passe" : "Create Password"}
                              value={formData.password}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 pr-10 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                            >
                              <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('becomeSupplier.account.confirmPassword')} *</label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder={isFr ? "Confirmer le mot de passe" : "Confirm Password"}
                              value={formData.confirmPassword}
                              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 pr-10 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                            >
                              <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-[11px] text-slate-500">
                        By completing your supplier profile, you agree to our{' '}
                        <a href="/terms" className="text-marcan-red hover:text-white underline underline-offset-4">
                          Terms of Service
                        </a>
                        .
                      </p>
                      <button
                        type="button"
                        onClick={prevStep}
                        className="text-slate-400 hover:text-white font-bold text-sm uppercase tracking-wider px-4"
                      >
                        {t('becomeSupplier.coreCapabilities.back')}
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="bg-marcan-red text-white px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <span><i className="fa-solid fa-spinner fa-spin mr-2"></i> {t('becomeSupplier.account.creatingAccount')}</span>
                        ) : (
                          t('becomeSupplier.account.completeSetup')
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
              <h3 className="font-heading text-xl font-bold text-white mb-2 uppercase">{t('becomeSupplier.restartModal.title')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {t('becomeSupplier.restartModal.body')}
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowRestartConfirm(false)}
                className="flex-1 bg-white/5 border border-white/10 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-white/10 transition-all"
              >
                {t('becomeSupplier.restartModal.cancel')}
              </button>
              <button
                onClick={confirmRestart}
                className="flex-1 bg-red-500 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-red-600 hover:shadow-neon transition-all"
              >
                {t('becomeSupplier.restartModal.restart')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
