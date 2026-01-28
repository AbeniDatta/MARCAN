'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';

type SignupView = 'role-selection' | 'buyer-form' | 'seller-wizard';
type WizardStep = 1 | 2 | 3;

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [currentView, setCurrentView] = useState<SignupView>('role-selection');
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Buyer form state
  const [buyerData, setBuyerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    phone: '',
    city: '',
    province: '',
  });

  // Seller wizard state
  const [sellerData, setSellerData] = useState({
    // Step 1
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    password: '',
    confirmPassword: '',
    // Step 2
    companyName: '',
    businessNumber: '',
    website: '',
    city: '',
    province: '',
    aboutUs: '',
    // Step 3
    capabilities: [] as string[],
    certifications: [] as string[],
  });

  const selectRole = (role: 'buyer' | 'seller') => {
    if (role === 'buyer') {
      setCurrentView('buyer-form');
    } else {
      setCurrentView('seller-wizard');
      setWizardStep(1);
    }
  };

  const resetSignup = () => {
    setCurrentView('role-selection');
    setWizardStep(1);
    setError('');
  };

  const nextWizardStep = () => {
    if (wizardStep < 3) {
      setWizardStep((prev) => (prev + 1) as WizardStep);
    }
  };

  const prevWizardStep = () => {
    if (wizardStep > 1) {
      setWizardStep((prev) => (prev - 1) as WizardStep);
    }
  };

  const handleBuyerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!buyerData.firstName || !buyerData.lastName || !buyerData.email || !buyerData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (buyerData.password !== buyerData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (buyerData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, buyerData.email, buyerData.password);
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, {
        displayName: `${buyerData.firstName} ${buyerData.lastName}`,
      });

      const userData = {
        firstName: buyerData.firstName,
        lastName: buyerData.lastName,
        email: buyerData.email,
        companyName: buyerData.company,
        phone: buyerData.phone,
        city: buyerData.city,
        province: buyerData.province,
        role: 'buy',
      };

      login(userData);
      router.push('/');
    } catch (err: any) {
      let errorMessage = 'An error occurred during signup.';
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleSellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!sellerData.firstName || !sellerData.lastName || !sellerData.email || !sellerData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (sellerData.password !== sellerData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (sellerData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, sellerData.email, sellerData.password);
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, {
        displayName: `${sellerData.firstName} ${sellerData.lastName}`,
      });

      const userData = {
        firstName: sellerData.firstName,
        lastName: sellerData.lastName,
        email: sellerData.email,
        jobTitle: sellerData.jobTitle,
        companyName: sellerData.companyName,
        businessNumber: sellerData.businessNumber,
        website: sellerData.website,
        city: sellerData.city,
        province: sellerData.province,
        aboutUs: sellerData.aboutUs,
        capabilities: sellerData.capabilities,
        certifications: sellerData.certifications,
        role: 'both',
      };

      login(userData);
      router.push('/');
    } catch (err: any) {
      let errorMessage = 'An error occurred during signup.';
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
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCapability = (cap: string) => {
    setSellerData((prev) => ({
      ...prev,
      capabilities: prev.capabilities.includes(cap)
        ? prev.capabilities.filter((c) => c !== cap)
        : [...prev.capabilities, cap],
    }));
  };

  const toggleCertification = (cert: string) => {
    setSellerData((prev) => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter((c) => c !== cert)
        : [...prev.certifications, cert],
    }));
  };

  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="Sign Up" />

      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="flex items-center justify-center py-10">
          <div className="glass-card p-10 rounded-3xl w-full max-w-4xl relative overflow-visible transition-all duration-500">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-marcan-red to-transparent shadow-neon"></div>

            {/* Error Message */}
            {error && (
              <div className="text-xs font-semibold mb-4 text-center text-marcan-red bg-marcan-red/10 border border-marcan-red/30 rounded-lg p-3">
                {error}
              </div>
            )}

            {/* STEP 1: ROLE SELECTION */}
            {currentView === 'role-selection' && (
              <div>
                <div className="text-center mb-12">
                  <h2 className="font-heading text-3xl font-black text-white uppercase tracking-widest mb-4">Join Marcan</h2>
                  <p className="text-slate-400 text-sm max-w-lg mx-auto">
                    Select your primary goal to customize your registration experience.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                  {/* Option 1: Buy Only */}
                  <button
                    onClick={() => selectRole('buyer')}
                    className="glass-card p-10 rounded-3xl border border-white/5 hover:border-blue-400/50 hover:bg-white/5 transition-all group text-left relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <i className="fa-solid fa-cart-shopping text-8xl text-white"></i>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-8 group-hover:scale-110 transition-transform shadow-lg">
                      <i className="fa-solid fa-magnifying-glass text-2xl"></i>
                    </div>
                    <h3 className="font-bold text-2xl text-white mb-3 uppercase">I want to Buy</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      I am an individual or procurement officer looking to source suppliers, post wishlists, and manage RFQs.
                    </p>
                    <div className="mt-6 text-blue-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 group-hover:gap-3 transition-all">
                      Start Registration <i className="fa-solid fa-arrow-right"></i>
                    </div>
                  </button>

                  {/* Option 2: Buy & Sell */}
                  <button
                    onClick={() => selectRole('seller')}
                    className="glass-card p-10 rounded-3xl border border-white/5 hover:border-marcan-red/50 hover:bg-white/5 transition-all group text-left relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <i className="fa-solid fa-industry text-8xl text-white"></i>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-marcan-red/20 flex items-center justify-center text-marcan-red mb-8 group-hover:scale-110 transition-transform shadow-lg">
                      <i className="fa-solid fa-handshake text-2xl"></i>
                    </div>
                    <h3 className="font-bold text-2xl text-white mb-3 uppercase">I want to Buy & Sell</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      I represent a manufacturing company. I want to sell my capacity/products AND source materials from others.
                    </p>
                    <div className="mt-6 text-marcan-red text-xs font-bold uppercase tracking-wider flex items-center gap-2 group-hover:gap-3 transition-all">
                      Create Company Profile <i className="fa-solid fa-arrow-right"></i>
                    </div>
                  </button>
                </div>

                <div className="mt-16 text-center">
                  <p className="text-xs text-slate-500">
                    Already a member?{' '}
                    <Link href="/login" className="text-marcan-red font-bold hover:text-white transition-colors ml-1">
                      Login
                    </Link>
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2A: BUYER FORM */}
            {currentView === 'buyer-form' && (
              <div>
                <button
                  onClick={resetSignup}
                  className="mb-6 flex items-center text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider group"
                >
                  <i className="fa-solid fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i> Change Role
                </button>

                <div className="text-center mb-10">
                  <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">Buyer Account</h2>
                  <p className="text-xs text-slate-500">Create your procurement profile.</p>
                </div>

                <form onSubmit={handleBuyerSubmit} className="space-y-6 max-w-2xl mx-auto">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">First Name</label>
                      <input
                        type="text"
                        placeholder="Jane"
                        value={buyerData.firstName}
                        onChange={(e) => setBuyerData({ ...buyerData, firstName: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Last Name</label>
                      <input
                        type="text"
                        placeholder="Doe"
                        value={buyerData.lastName}
                        onChange={(e) => setBuyerData({ ...buyerData, lastName: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Email Address</label>
                    <input
                      type="email"
                      placeholder="jane.doe@example.com"
                      value={buyerData.email}
                      onChange={(e) => setBuyerData({ ...buyerData, email: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Password</label>
                      <input
                        type="password"
                        placeholder="Create Password"
                        value={buyerData.password}
                        onChange={(e) => setBuyerData({ ...buyerData, password: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Confirm Password</label>
                      <input
                        type="password"
                        placeholder="Repeat Password"
                        value={buyerData.confirmPassword}
                        onChange={(e) => setBuyerData({ ...buyerData, confirmPassword: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <label className="text-[10px] font-bold text-marcan-red uppercase mb-4 block tracking-widest">Profile Details</label>
                    <div className="grid grid-cols-2 gap-6 mb-4">
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Company (Optional)</label>
                        <input
                          type="text"
                          placeholder="Organization you represent"
                          value={buyerData.company}
                          onChange={(e) => setBuyerData({ ...buyerData, company: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Phone Number</label>
                        <input
                          type="text"
                          placeholder="+1 (555) 000-0000"
                          value={buyerData.phone}
                          onChange={(e) => setBuyerData({ ...buyerData, phone: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Location</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="City"
                            value={buyerData.city}
                            onChange={(e) => setBuyerData({ ...buyerData, city: e.target.value })}
                            className="bg-black/40 border border-white/10 rounded-lg px-3 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none"
                          />
                          <select
                            value={buyerData.province}
                            onChange={(e) => setBuyerData({ ...buyerData, province: e.target.value })}
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
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-marcan-red text-white py-4 rounded-lg font-bold text-sm uppercase tracking-widest hover:shadow-neon hover:scale-[1.02] transition-all duration-300 mt-6 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span>
                        <i className="fa-solid fa-spinner fa-spin mr-2"></i> Creating Account...
                      </span>
                    ) : (
                      'Create Buyer Account'
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 2B: SELLER WIZARD */}
            {currentView === 'seller-wizard' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <button
                    onClick={resetSignup}
                    className="flex items-center text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider group"
                  >
                    <i className="fa-solid fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i> Change Role
                  </button>
                  <div className="flex items-center gap-2">
                    <div className={`h-1 w-8 rounded-full transition-all ${wizardStep >= 1 ? 'bg-marcan-red' : 'bg-white/10'}`}></div>
                    <div className={`h-1 w-8 rounded-full transition-all ${wizardStep >= 2 ? 'bg-marcan-red' : 'bg-white/10'}`}></div>
                    <div className={`h-1 w-8 rounded-full transition-all ${wizardStep >= 3 ? 'bg-marcan-red' : 'bg-white/10'}`}></div>
                  </div>
                </div>

                <form onSubmit={handleSellerSubmit} className="max-w-2xl mx-auto">
                  {/* Slide 1: Account Info */}
                  <div
                    className={`transition-all duration-300 ${wizardStep === 1 ? 'opacity-100 translate-x-0 block' : 'opacity-0 pointer-events-none translate-x-10 hidden'
                      }`}
                  >
                    <div className="text-center mb-8">
                      <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">Account Setup</h2>
                      <p className="text-xs text-slate-500">Step 1 of 3: User Credentials</p>
                    </div>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">First Name</label>
                          <input
                            type="text"
                            placeholder="John"
                            value={sellerData.firstName}
                            onChange={(e) => setSellerData({ ...sellerData, firstName: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Last Name</label>
                          <input
                            type="text"
                            placeholder="Smith"
                            value={sellerData.lastName}
                            onChange={(e) => setSellerData({ ...sellerData, lastName: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Work Email</label>
                        <input
                          type="email"
                          placeholder="john.smith@company.com"
                          value={sellerData.email}
                          onChange={(e) => setSellerData({ ...sellerData, email: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Job Title</label>
                        <input
                          type="text"
                          placeholder="Procurement Manager"
                          value={sellerData.jobTitle}
                          onChange={(e) => setSellerData({ ...sellerData, jobTitle: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Password</label>
                          <input
                            type="password"
                            placeholder="Create Password"
                            value={sellerData.password}
                            onChange={(e) => setSellerData({ ...sellerData, password: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Confirm</label>
                          <input
                            type="password"
                            placeholder="Confirm Password"
                            value={sellerData.confirmPassword}
                            onChange={(e) => setSellerData({ ...sellerData, confirmPassword: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-8 flex justify-end">
                      <button
                        type="button"
                        onClick={nextWizardStep}
                        className="bg-marcan-red text-white px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:shadow-neon transition-all"
                      >
                        Next Step <i className="fa-solid fa-arrow-right ml-2"></i>
                      </button>
                    </div>
                  </div>

                  {/* Slide 2: Company Info */}
                  <div
                    className={`transition-all duration-300 ${wizardStep === 2 ? 'opacity-100 translate-x-0 block' : 'opacity-0 pointer-events-none translate-x-10 hidden'
                      }`}
                  >
                    <div className="text-center mb-8">
                      <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">Company Profile</h2>
                      <p className="text-xs text-slate-500">Step 2 of 3: Business Details</p>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Legal Company Name</label>
                        <input
                          type="text"
                          placeholder="NorthYork Precision Ltd."
                          value={sellerData.companyName}
                          onChange={(e) => setSellerData({ ...sellerData, companyName: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Business Number (BN)</label>
                          <input
                            type="text"
                            placeholder="12345 6789 RT0001"
                            value={sellerData.businessNumber}
                            onChange={(e) => setSellerData({ ...sellerData, businessNumber: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Website</label>
                          <input
                            type="text"
                            placeholder="www.company.com"
                            value={sellerData.website}
                            onChange={(e) => setSellerData({ ...sellerData, website: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">City</label>
                          <input
                            type="text"
                            placeholder="Toronto"
                            value={sellerData.city}
                            onChange={(e) => setSellerData({ ...sellerData, city: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Province</label>
                          <select
                            value={sellerData.province}
                            onChange={(e) => setSellerData({ ...sellerData, province: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-slate-400 focus:border-marcan-red outline-none"
                          >
                            <option value="">Select...</option>
                            <option value="ON">Ontario</option>
                            <option value="QC">Quebec</option>
                            <option value="AB">Alberta</option>
                            <option value="BC">British Columbia</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">About Us</label>
                        <textarea
                          rows={3}
                          placeholder="Describe your company history, mission, and specialization..."
                          value={sellerData.aboutUs}
                          onChange={(e) => setSellerData({ ...sellerData, aboutUs: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                        ></textarea>
                      </div>
                    </div>
                    <div className="mt-8 flex justify-between">
                      <button
                        type="button"
                        onClick={prevWizardStep}
                        className="text-slate-400 hover:text-white font-bold text-sm uppercase tracking-wider px-4"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={nextWizardStep}
                        className="bg-marcan-red text-white px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:shadow-neon transition-all"
                      >
                        Next Step <i className="fa-solid fa-arrow-right ml-2"></i>
                      </button>
                    </div>
                  </div>

                  {/* Slide 3: Capabilities */}
                  <div
                    className={`transition-all duration-300 ${wizardStep === 3 ? 'opacity-100 translate-x-0 block' : 'opacity-0 pointer-events-none translate-x-10 hidden'
                      }`}
                  >
                    <div className="text-center mb-8">
                      <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">Capabilities</h2>
                      <p className="text-xs text-slate-500">Step 3 of 3: Skill Tags</p>
                    </div>
                    <div className="space-y-6">
                      <div className="flex gap-4 items-center mb-6 p-4 rounded-lg bg-white/5 border border-white/5">
                        <div className="w-16 h-16 rounded-lg bg-black/40 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:border-marcan-red transition">
                          <i className="fa-solid fa-camera"></i>
                          <span className="text-[8px] uppercase mt-1">Logo</span>
                        </div>
                        <div className="text-xs text-slate-400">Upload your company logo to stand out in the directory.</div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-marcan-red uppercase mb-3 block">Primary Capabilities</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {['CNC Machining', 'Casting', 'Fabrication', 'Finishing', 'Tooling', 'Assembly'].map((cap) => (
                            <label
                              key={cap}
                              className="flex items-center gap-2 p-2 rounded bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50"
                            >
                              <input
                                type="checkbox"
                                checked={sellerData.capabilities.includes(cap)}
                                onChange={() => toggleCapability(cap)}
                                className="rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                              />
                              <span className="text-[10px] font-bold text-white uppercase">{cap}</span>
                            </label>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="+ Add custom capability..."
                          className="w-full mt-2 bg-transparent border-b border-white/10 py-2 text-xs text-white focus:border-marcan-red outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-marcan-red uppercase mb-3 block">Certifications</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {['ISO 9001', 'AS9100', 'CGRP'].map((cert) => (
                            <label
                              key={cert}
                              className="flex items-center gap-2 p-2 rounded bg-black/40 border border-white/10 cursor-pointer hover:border-marcan-red/50"
                            >
                              <input
                                type="checkbox"
                                checked={sellerData.certifications.includes(cert)}
                                onChange={() => toggleCertification(cert)}
                                className="rounded bg-transparent border-white/20 text-marcan-red focus:ring-0"
                              />
                              <span className="text-[10px] font-bold text-white uppercase">{cert}</span>
                            </label>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="+ Add custom certification..."
                          className="w-full mt-2 bg-transparent border-b border-white/10 py-2 text-xs text-white focus:border-marcan-red outline-none"
                        />
                      </div>
                    </div>
                    <div className="mt-8 flex justify-between">
                      <button
                        type="button"
                        onClick={prevWizardStep}
                        className="text-slate-400 hover:text-white font-bold text-sm uppercase tracking-wider px-4"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-marcan-red text-white px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <span>
                            <i className="fa-solid fa-spinner fa-spin mr-2"></i> Creating...
                          </span>
                        ) : (
                          'Create Profile'
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
