'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';

type WizardStep = 0 | 1 | 2 | 3 | 4 | 5;
type View = 'landing' | 'form';
type OnboardingMethod = 'IMPORT' | 'MANUAL';
type TypicalJobSize = 'PROTOTYPE' | 'LOW_VOLUME' | 'MEDIUM_VOLUME' | 'HIGH_VOLUME';
type PreferredContactMethod = 'EMAIL' | 'PLATFORM_ONLY';

interface Capability {
  id: string;
  type: string;
  slug: string;
  name: string;
}

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
  const [currentView, setCurrentView] = useState<View>('landing');
  const [wizardStep, setWizardStep] = useState<WizardStep>(0);
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
    typicalJobSize: null as TypicalJobSize | null,
    leadTimeMinDays: '',
    leadTimeMaxDays: '',
    maxPartSizeMmX: '',
    maxPartSizeMmY: '',
    maxPartSizeMmZ: '',
    // Step 4
    certifications: [] as string[], // capability IDs
    industries: [] as string[], // capability IDs
    otherCertifications: '', // custom certifications not in list
    otherIndustries: '', // custom industries not in list
    aboutUs: '',
    // Step 5
    rfqEmail: '',
    preferredContactMethod: null as PreferredContactMethod | null,
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
            setFormData(parsed.formData);
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

  // Redirect if not authenticated
  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isMounted, isAuthenticated, router]);

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
        provincesServed: importedData.provincesServed || formData.provincesServed,
        companyType: importedData.companyType || formData.companyType,
        website: importedData.website || importUrl.trim(),
        processes: importedData.processes || formData.processes,
        materials: importedData.materials || formData.materials,
        finishes: importedData.finishes || formData.finishes,
        certifications: importedData.certifications || formData.certifications,
        industries: importedData.industries || formData.industries,
        typicalJobSize: importedData.typicalJobSize || formData.typicalJobSize,
        leadTimeMinDays: importedData.leadTimeMinDays || formData.leadTimeMinDays,
        leadTimeMaxDays: importedData.leadTimeMaxDays || formData.leadTimeMaxDays,
        maxPartSizeMmX: importedData.maxPartSizeMmX || formData.maxPartSizeMmX,
        maxPartSizeMmY: importedData.maxPartSizeMmY || formData.maxPartSizeMmY,
        maxPartSizeMmZ: importedData.maxPartSizeMmZ || formData.maxPartSizeMmZ,
        aboutUs: importedData.aboutUs || formData.aboutUs,
        rfqEmail: importedData.rfqEmail || formData.rfqEmail,
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
      if (wizardStep < 5) {
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
        return true;
      case 2:
        if (formData.processes.length === 0 || formData.materials.length === 0) {
          setError('Please select at least one process and one material');
          return false;
        }
        return true;
      case 3:
        if (!formData.typicalJobSize) {
          setError('Please select a typical job size');
          return false;
        }
        return true;
      case 5:
        if (!formData.rfqEmail) {
          setError('RFQ email is required');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    if (!currentUser || !currentUser.email) {
      setError('You must be logged in to complete setup');
      return;
    }

    setIsLoading(true);
    setError('');

    const submitData = {
      userId: currentUser.email,
      onboardingMethod: formData.onboardingMethod,
      companyName: formData.companyName,
      city: formData.city,
      province: formData.province,
      provincesServed: formData.provincesServed,
      website: formData.website || null,
      companyType: formData.companyType,
      processes: formData.processes,
      materials: formData.materials,
      finishes: formData.finishes,
      typicalJobSize: formData.typicalJobSize,
      leadTimeMinDays: formData.leadTimeMinDays ? parseInt(formData.leadTimeMinDays) : null,
      leadTimeMaxDays: formData.leadTimeMaxDays ? parseInt(formData.leadTimeMaxDays) : null,
      maxPartSizeMmX: formData.maxPartSizeMmX ? parseInt(formData.maxPartSizeMmX) : null,
      maxPartSizeMmY: formData.maxPartSizeMmY ? parseInt(formData.maxPartSizeMmY) : null,
      maxPartSizeMmZ: formData.maxPartSizeMmZ ? parseInt(formData.maxPartSizeMmZ) : null,
      certifications: formData.certifications,
      industries: formData.industries,
      aboutUs: formData.aboutUs || null,
      rfqEmail: formData.rfqEmail,
      preferredContactMethod: formData.preferredContactMethod,
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

      // Update user role in localStorage to reflect seller status
      const updatedUser = {
        ...currentUser,
        role: 'both', // User is now both buyer and seller
        companyName: formData.companyName,
        city: formData.city,
        province: formData.province,
      };

      // Update localStorage
      localStorage.setItem('marcan_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('marcan-auth-change'));

      // Update auth state
      login(updatedUser);

      // Clear saved registration data since registration is complete
      if (currentUser?.email) {
        const savedDataKey = `seller_registration_${currentUser.email}`;
        localStorage.removeItem(savedDataKey);
      }

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving your profile');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item) ? array.filter(i => i !== item) : [...array, item];
  };

  const handleRestartRegistration = () => {
    setShowRestartConfirm(true);
  };

  const confirmRestart = () => {
    // Clear form data
    setFormData({
      onboardingMethod: null,
      companyName: '',
      city: '',
      province: '',
      provincesServed: [],
      companyType: null,
      website: '',
      processes: [],
      materials: [],
      finishes: [],
      typicalJobSize: null,
      leadTimeMinDays: '',
      leadTimeMaxDays: '',
      maxPartSizeMmX: '',
      maxPartSizeMmY: '',
      maxPartSizeMmZ: '',
      certifications: [],
      industries: [],
      aboutUs: '',
      rfqEmail: '',
      preferredContactMethod: null,
    });

    // Reset state
    setWizardStep(0);
    setLastCompletedStep(null);
    setCurrentView('landing');
    setImportUrl('');
    setError('');

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

            {error && (
              <div className="text-xs font-semibold mb-4 text-center text-marcan-red bg-marcan-red/10 border border-marcan-red/30 rounded-lg p-3">
                {error}
              </div>
            )}

            {/* LANDING PAGE */}
            {currentView === 'landing' && (
              <div className="flex items-center justify-center min-h-[calc(100vh-140px)]">
                <div className="glass-card p-12 rounded-3xl w-full max-w-3xl text-center relative overflow-hidden flex flex-col items-center justify-center border border-white/10">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-marcan-red to-transparent shadow-neon"></div>
                  <div className="absolute -right-20 -top-20 w-64 h-64 bg-marcan-red/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                  <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-marcan-red to-red-900 shadow-neon text-white text-4xl animate-pulse-slow">
                    <i className="fa-solid fa-handshake"></i>
                  </div>

                  <h2 className="font-heading text-4xl md:text-5xl font-black text-white uppercase tracking-widest mb-6 leading-tight">
                    Welcome to the <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-marcan-red to-orange-500 text-glow">MARCAN Network</span>
                  </h2>

                  <p className="text-xl text-slate-300 leading-relaxed mb-10 max-w-xl mx-auto font-light">
                    We're glad to have you join our network! <br />
                    Marcan connects you with the partners you need to grow your business and strengthen the Canadian supply chain.
                  </p>

                  <button
                    onClick={() => {
                      setCurrentView('form');
                      // If user has progress, resume from last completed step + 1
                      // But don't go beyond step 5 (the last step)
                      if (lastCompletedStep !== null && lastCompletedStep >= 0 && lastCompletedStep < 5) {
                        setWizardStep((lastCompletedStep + 1) as WizardStep);
                      } else if (lastCompletedStep === 5) {
                        // If they completed all steps, start from step 5 (final step)
                        setWizardStep(5);
                      } else {
                        setWizardStep(0);
                      }
                    }}
                    className="bg-marcan-red text-white px-10 py-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:shadow-neon hover:scale-105 transition-all duration-300 shadow-lg flex items-center gap-3"
                  >
                    {lastCompletedStep !== null && lastCompletedStep >= 0 ? 'Continue Registration' : 'Begin Registration'} <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* WIZARD FORM */}
            {currentView === 'form' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <button
                    onClick={() => setCurrentView('landing')}
                    className="flex items-center text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider group"
                  >
                    <i className="fa-solid fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i> Back to Home
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {[0, 1, 2, 3, 4, 5].map((step) => (
                        <div
                          key={step}
                          className={`h-1 w-6 rounded-full transition-all ${wizardStep >= step ? 'bg-marcan-red' : 'bg-white/10'}`}
                        ></div>
                      ))}
                    </div>
                    <button
                      onClick={handleRestartRegistration}
                      className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors text-xs font-bold uppercase tracking-wider group"
                      title="Restart Registration"
                    >
                      <i className="fa-solid fa-rotate-left group-hover:rotate-180 transition-transform duration-500"></i>
                      <span className="hidden sm:inline">Restart</span>
                    </button>
                  </div>
                </div>

                {/* Step 0: Entry - Onboarding Method */}
                {wizardStep === 0 && (
                  <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                      <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">Get Started</h2>
                      <p className="text-xs text-slate-500">How would you like to set up your profile?</p>
                    </div>

                    {formData.onboardingMethod === null && (
                      <div className="grid grid-cols-2 gap-6">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, onboardingMethod: 'IMPORT' });
                          }}
                          className="p-8 rounded-lg border-2 border-white/10 hover:border-marcan-red/50 transition-all"
                        >
                          <i className="fa-solid fa-globe text-4xl mb-4 text-marcan-red"></i>
                          <div className="text-white font-bold text-sm uppercase mb-2">Import from Website</div>
                          <div className="text-xs text-slate-400">Automatically import company information</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, onboardingMethod: 'MANUAL' });
                            setLastCompletedStep(0);
                            setWizardStep(1);
                            setError('');
                          }}
                          className="p-8 rounded-lg border-2 border-white/10 hover:border-marcan-red/50 transition-all"
                        >
                          <i className="fa-solid fa-pen-to-square text-4xl mb-4 text-marcan-red"></i>
                          <div className="text-white font-bold text-sm uppercase mb-2">Fill Manually</div>
                          <div className="text-xs text-slate-400">Enter your information step by step</div>
                        </button>
                      </div>
                    )}

                    {formData.onboardingMethod === 'IMPORT' && (
                      <div className="space-y-6">
                        <div className="p-6 rounded-lg border-2 border-marcan-red bg-marcan-red/10">
                          <div className="flex items-center gap-3 mb-4">
                            <i className="fa-solid fa-globe text-2xl text-marcan-red"></i>
                            <h3 className="text-white font-bold text-sm uppercase">Import from Website</h3>
                          </div>
                          <p className="text-xs text-slate-400 mb-4">
                            Enter your company website URL below. We'll automatically extract and fill in your company information.
                          </p>

                          <div className="space-y-4">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">
                                Website URL *
                              </label>
                              <input
                                type="url"
                                value={importUrl}
                                onChange={(e) => setImportUrl(e.target.value)}
                                placeholder="https://www.yourcompany.com"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                                disabled={isImporting}
                              />
                            </div>

                            {error && (
                              <div className="text-xs font-semibold text-marcan-red bg-marcan-red/10 border border-marcan-red/30 rounded-lg p-3">
                                {error}
                              </div>
                            )}

                            <div className="flex gap-4">
                              <button
                                type="button"
                                onClick={handleImportWebsite}
                                disabled={isImporting || !importUrl.trim()}
                                className="flex-1 bg-marcan-red text-white px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                {isImporting ? (
                                  <>
                                    <i className="fa-solid fa-spinner fa-spin"></i>
                                    Importing...
                                  </>
                                ) : (
                                  <>
                                    <i className="fa-solid fa-download"></i>
                                    Import & Continue
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, onboardingMethod: null });
                                  setImportUrl('');
                                  setError('');
                                }}
                                disabled={isImporting}
                                className="px-6 py-3 rounded-lg border border-white/10 text-white text-sm font-bold uppercase tracking-wider hover:bg-white/5 transition-all disabled:opacity-50"
                              >
                                Back
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 1: Company Basics */}
                {wizardStep === 1 && (
                  <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                      <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">Company Basics</h2>
                      <p className="text-xs text-slate-500">Step 1 of 5</p>
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
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Company Type</label>
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
                    <div className="mt-8 flex justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, onboardingMethod: null });
                          setImportUrl('');
                          setWizardStep(0);
                          setError('');
                        }}
                        className="text-slate-400 hover:text-white font-bold text-sm uppercase tracking-wider px-4 transition-colors"
                      >
                        <i className="fa-solid fa-arrow-left mr-2"></i> Back
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

                {/* Step 2: Core Manufacturing Capabilities */}
                {wizardStep === 2 && (
                  <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                      <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">Core Capabilities</h2>
                      <p className="text-xs text-slate-500">Step 2 of 5: Select at least one process and one material</p>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-bold text-marcan-red uppercase mb-3 block">Primary Processes *</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                          <p className="text-[10px] text-slate-500 mt-1">Add materials not listed above. These will be saved as comments for AI search.</p>
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
                          <p className="text-[10px] text-slate-500 mt-1">Add finishes not listed above. These will be saved as comments for AI search.</p>
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
                      <p className="text-xs text-slate-500">Step 3 of 5</p>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Typical Job Size *</label>
                        <div className="grid grid-cols-2 gap-4">
                          {(['PROTOTYPE', 'LOW_VOLUME', 'MEDIUM_VOLUME', 'HIGH_VOLUME'] as TypicalJobSize[]).map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => setFormData({ ...formData, typicalJobSize: size })}
                              className={`p-4 rounded-lg border-2 transition-all text-left ${formData.typicalJobSize === size ? 'border-marcan-red bg-marcan-red/10' : 'border-white/10 hover:border-marcan-red/50'}`}
                            >
                              <div className="text-white font-bold text-sm uppercase">{size.replace('_', ' ')}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Lead Time Min (Days)</label>
                          <input
                            type="number"
                            placeholder="7"
                            value={formData.leadTimeMinDays}
                            onChange={(e) => setFormData({ ...formData, leadTimeMinDays: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Lead Time Max (Days)</label>
                          <input
                            type="number"
                            placeholder="30"
                            value={formData.leadTimeMaxDays}
                            onChange={(e) => setFormData({ ...formData, leadTimeMaxDays: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          />
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
                      <p className="text-xs text-slate-500">Step 4 of 5: Optional</p>
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
                          <p className="text-[10px] text-slate-500 mt-1">Add certifications not listed above. These will be saved as comments for AI search.</p>
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
                          <p className="text-[10px] text-slate-500 mt-1">Add industries not listed above. These will be saved as comments for AI search.</p>
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
                      <p className="text-xs text-slate-500">Step 5 of 5</p>
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
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Preferred Contact Method</label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, preferredContactMethod: 'EMAIL' })}
                            className={`p-4 rounded-lg border-2 transition-all text-left ${formData.preferredContactMethod === 'EMAIL' ? 'border-marcan-red bg-marcan-red/10' : 'border-white/10 hover:border-marcan-red/50'}`}
                          >
                            <div className="text-white font-bold text-sm uppercase">Email</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, preferredContactMethod: 'PLATFORM_ONLY' })}
                            className={`p-4 rounded-lg border-2 transition-all text-left ${formData.preferredContactMethod === 'PLATFORM_ONLY' ? 'border-marcan-red bg-marcan-red/10' : 'border-white/10 hover:border-marcan-red/50'}`}
                          >
                            <div className="text-white font-bold text-sm uppercase">Platform Only</div>
                          </button>
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
                          <span><i className="fa-solid fa-spinner fa-spin mr-2"></i> Saving...</span>
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
