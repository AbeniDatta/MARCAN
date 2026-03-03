'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupMode, setSignupMode] = useState<'choice' | 'buyer'>('choice');
  const [choiceEmail, setChoiceEmail] = useState('');
  const [supplierWebsite, setSupplierWebsite] = useState('');

  // Buyer form state
  const [buyerData, setBuyerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    jobTitle: '',
    phone: '',
    city: '',
    province: '',
  });

  const handleBuyerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!buyerData.firstName || !buyerData.lastName || !buyerData.email || !buyerData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    // If company name is provided, job title is required
    if (buyerData.company.trim() && !buyerData.jobTitle.trim()) {
      setError('Please enter your role in the company.');
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
        jobTitle: buyerData.jobTitle,
        phone: buyerData.phone,
        city: buyerData.city,
        province: buyerData.province,
        role: 'buy',
      };

      // Save to database
      try {
        const saveResponse = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: buyerData.email,
            firstName: buyerData.firstName,
            lastName: buyerData.lastName,
            email: buyerData.email,
            companyName: buyerData.company || `${buyerData.firstName} ${buyerData.lastName}`.trim(),
            jobTitle: buyerData.jobTitle || null,
            phone: buyerData.phone || null,
            city: buyerData.city || null,
            province: buyerData.province || null,
          }),
        });

        if (!saveResponse.ok) {
          const errorData = await saveResponse.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Failed to save user data to database:', errorData);
          // Don't throw - allow user to continue, but log the error
          // The profile can be created/updated later from My Account page
        } else {
          const result = await saveResponse.json();
          console.log('Profile created successfully:', result);
        }
      } catch (dbError: any) {
        console.error('Error saving to database:', dbError);
        // Don't throw - allow user to continue, but log the error
        // The profile can be created/updated later from My Account page
      }

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

            {/* MODE: CHOICE */}
            {signupMode === 'choice' && (
              <div className="text-center mb-4">
                <h2 className="font-heading text-2xl md:text-3xl font-black text-white uppercase tracking-widest mb-3">
                  How do you want to use Marcan?
                </h2>
                <p className="text-xs text-slate-500 mb-6 max-w-xl mx-auto">
                  Choose the path that fits you best. You can always create another type of profile later.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-6 items-stretch">
                  {/* Option A: Buyer / Sourcing */}
                  <div className="group glass-card border border-white/10 hover:border-marcan-red/60 hover:bg-white/5 rounded-2xl p-6 text-left transition-all duration-300 h-full flex flex-col">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <i className="fa-solid fa-magnifying-glass-chart"></i>
                      </div>
                      <div>
                        <h3 className="text-white font-heading font-bold text-lg">
                          Join as a Buyer
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      Standard fast sign-up to post requirements, manage RFQs, and connect with vetted Canadian suppliers.
                    </p>

                    {/* Email field under Option A */}
                    <div className="mt-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block text-left">
                        Work Email
                      </label>
                      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                        <input
                          type="email"
                          value={choiceEmail}
                          onChange={(e) => setChoiceEmail(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (!choiceEmail.trim()) {
                                setError('Please enter your email to continue as a buyer.');
                                return;
                              }
                              setBuyerData((prev) => ({ ...prev, email: choiceEmail.trim() }));
                              setSignupMode('buyer');
                            }
                          }}
                          placeholder="you@company.com"
                          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-marcan-red focus:shadow-neon"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!choiceEmail.trim()) {
                              setError('Please enter your email to continue as a buyer.');
                              return;
                            }
                            setBuyerData((prev) => ({ ...prev, email: choiceEmail.trim() }));
                            setSignupMode('buyer');
                          }}
                          className="sm:w-10 bg-marcan-red text-white px-0 py-0 rounded-lg font-bold text-[12px] uppercase tracking-widest hover:shadow-neon hover:scale-[1.05] transition-all duration-300 whitespace-nowrap flex items-center justify-center"
                        >
                          <i className="fa-solid fa-arrow-right"></i>
                        </button>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-500 text-left">
                        We&apos;ll pre-fill your account with this email on the next step.
                      </p>
                    </div>
                  </div>

                  {/* Option B: Supplier / Seller */}
                  <div className="group glass-card border border-marcan-red/50 bg-marcan-red/5 hover:bg-marcan-red/10 rounded-2xl p-6 text-left transition-all duration-300 h-full flex flex-col">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-10 h-10 rounded-full bg-marcan-red/20 flex items-center justify-center text-marcan-red">
                        <i className="fa-solid fa-industry"></i>
                      </div>
                      <div>
                        <h3 className="text-white font-heading font-bold text-lg">
                          Join as a Supplier
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed mb-2">
                      Showcase your shop to buyers across Canada with an{' '}
                      <span className="text-white font-bold">AI-powered 2-minute setup via your website URL.</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mb-4">
                      Paste your existing website and let Marcan’s AI scraper build a comprehensive supplier profile for you.
                    </p>

                    {/* Website URL under Supplier option */}
                    <div className="mt-1">
                      <label className="text-[10px] font-bold text-slate-300 uppercase mb-1 block text-left">
                        Website URL
                      </label>
                      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                        <input
                          type="url"
                          value={supplierWebsite}
                          onChange={(e) => setSupplierWebsite(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const base = '/become-seller?start=import';
                              const urlParam = supplierWebsite.trim()
                                ? `&url=${encodeURIComponent(supplierWebsite.trim())}`
                                : '';
                              router.push(`${base}${urlParam}`);
                            }
                          }}
                          placeholder="https://www.yourcompany.com"
                          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-marcan-red focus:shadow-neon"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const base = '/become-seller?start=import';
                            const urlParam = supplierWebsite.trim()
                              ? `&url=${encodeURIComponent(supplierWebsite.trim())}`
                              : '';
                            router.push(`${base}${urlParam}`);
                          }}
                          className="sm:w-10 bg-marcan-red text-white px-0 py-0 rounded-lg font-bold text-[12px] uppercase tracking-widest hover:shadow-neon hover:scale-[1.05] transition-all duration-300 whitespace-nowrap flex items-center justify-center"
                          aria-label="Start supplier setup"
                        >
                          <i className="fa-solid fa-arrow-right"></i>
                        </button>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-400 text-left mb-3">
                        Don&apos;t have a website or prefer to fill it out manually?{' '}
                        <button
                          type="button"
                          onClick={() => router.push('/become-seller?start=manual')}
                          className="text-marcan-red font-bold hover:text-white underline underline-offset-4"
                        >
                          Click here
                        </button>
                        .
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  Already a member?{' '}
                  <Link href="/login" className="text-marcan-red font-bold hover:text-white transition-colors ml-1">
                    Login
                  </Link>
                </p>
              </div>
            )}

            {/* MODE: BUYER FORM */}
            {signupMode === 'buyer' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="text-left">
                    <h2 className="font-heading text-2xl font-black text-white uppercase tracking-widest mb-2">
                      Create Your Account
                    </h2>
                    <p className="text-xs text-slate-500">Create your procurement profile to start sourcing manufacturers.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSignupMode('choice')}
                    className="text-[11px] text-slate-500 hover:text-white font-bold uppercase tracking-widest flex items-center gap-2"
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                    Change Option
                  </button>
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
                        placeholder="Confirm Password"
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
                          onChange={(e) => setBuyerData({ ...buyerData, company: e.target.value, jobTitle: e.target.value.trim() ? buyerData.jobTitle : '' })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
                        />
                      </div>
                      {buyerData.company.trim() && (
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-marcan-red uppercase mb-1 block">
                            Role in Company <span className="text-marcan-red">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Procurement Manager, Buyer, Director"
                            value={buyerData.jobTitle}
                            onChange={(e) => setBuyerData({ ...buyerData, jobTitle: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
                            required
                          />
                        </div>
                      )}
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
                            className="bg-black/40 border border-white/10 rounded-lg px-3 py-3 text-sm font-semibold text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600"
                          />
                          <select
                            value={buyerData.province}
                            onChange={(e) => setBuyerData({ ...buyerData, province: e.target.value })}
                            className="bg-black/40 border border-white/10 rounded-lg px-2 py-3 text-sm font-semibold text-slate-400 focus:border-marcan-red focus:shadow-neon outline-none"
                          >
                            <option value="">Prov.</option>
                            <option value="ON">ON</option>
                            <option value="QC">QC</option>
                            <option value="BC">BC</option>
                            <option value="AB">AB</option>
                            <option value="MB">MB</option>
                            <option value="SK">SK</option>
                            <option value="NS">NS</option>
                            <option value="NB">NB</option>
                            <option value="NL">NL</option>
                            <option value="PE">PE</option>
                            <option value="NT">NT</option>
                            <option value="YT">YT</option>
                            <option value="NU">NU</option>
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
                      'Create Your Account'
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-xs text-slate-500">
                    Already a member?{' '}
                    <Link href="/login" className="text-marcan-red font-bold hover:text-white transition-colors ml-1">
                      Login
                    </Link>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
