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
  const [error, setError] = useState('');
  const [choiceEmail, setChoiceEmail] = useState('');
  const [supplierWebsite, setSupplierWebsite] = useState('');

  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="Sign Up" />

      <div className="flex-1 overflow-hidden p-4 relative">
        <div className="flex items-center justify-center py-4">
          <div className="glass-card p-6 rounded-3xl w-full max-w-[95rem] relative overflow-visible transition-all duration-500">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-marcan-red to-transparent shadow-neon"></div>

            {/* Error Message */}
            {error && (
              <div className="text-xs font-semibold mb-4 text-center text-marcan-red bg-marcan-red/10 border border-marcan-red/30 rounded-lg p-3">
                {error}
              </div>
            )}

            <div className="text-center mb-2">
              <h2 className="font-heading text-2xl md:text-3xl font-black text-white uppercase tracking-widest mb-2">
                How do you want to use Marcan?
              </h2>
              <p className="text-sm text-slate-500 mb-4 max-w-xl mx-auto">
                Choose the path that fits you best. You can always create another type of profile later.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[95rem] mx-auto mb-4 items-stretch px-4">
                {/* Option A: Buyer / Sourcing */}
                <div className="group glass-card border border-white/10 hover:border-marcan-red/60 hover:bg-white/5 rounded-3xl p-8 text-left transition-all duration-300 h-full flex flex-col">
                  <div className="flex items-center gap-5 mb-4">
                    <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <i className="fa-solid fa-magnifying-glass-chart text-2xl"></i>
                    </div>
                    <div>
                      <h3 className="text-white font-heading font-bold text-2xl">
                        Join as a Buyer
                      </h3>
                    </div>
                  </div>
                  <p className="text-base text-slate-300 leading-relaxed mb-3">
                    Post requirements and receive competitive quotes from{' '}
                    <span className="text-white font-bold">vetted Canadian suppliers.</span>
                  </p>
                  <p className="text-sm text-slate-400 mb-5">
                    Manage RFQs, track quotes, and connect directly with manufacturers - all in one place.
                  </p>

                  {/* Email field under Option A */}
                  <div className="mt-4">
                    <label className="text-sm font-bold text-slate-400 uppercase mb-2 block text-left">
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
                            router.push(`/signup/buyer?email=${encodeURIComponent(choiceEmail.trim())}`);
                          }
                        }}
                        placeholder="you@company.com"
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-marcan-red focus:shadow-neon"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!choiceEmail.trim()) {
                            setError('Please enter your email to continue as a buyer.');
                            return;
                          }
                          router.push(`/signup/buyer?email=${encodeURIComponent(choiceEmail.trim())}`);
                        }}
                        className="sm:w-14 bg-marcan-red text-white px-0 py-0 rounded-lg font-bold text-sm uppercase tracking-widest hover:shadow-neon hover:scale-[1.05] transition-all duration-300 whitespace-nowrap flex items-center justify-center"
                      >
                        <i className="fa-solid fa-arrow-right"></i>
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-slate-500 text-left">
                      We&apos;ll pre-fill your account with this email on the next step.
                    </p>
                  </div>
                </div>

                {/* Option B: Supplier / Seller */}
                <div className="group glass-card border border-marcan-red/50 bg-marcan-red/5 hover:bg-marcan-red/10 rounded-3xl p-8 text-left transition-all duration-300 h-full flex flex-col">
                  <div className="flex items-center gap-5 mb-4">
                    <div className="w-20 h-20 rounded-full bg-marcan-red/20 flex items-center justify-center text-marcan-red">
                      <i className="fa-solid fa-industry text-2xl"></i>
                    </div>
                    <div>
                      <h3 className="text-white font-heading font-bold text-2xl">
                        Join as a Supplier
                      </h3>
                    </div>
                  </div>
                  <p className="text-base text-slate-300 leading-relaxed mb-3">
                    Showcase your shop with an{' '}
                    <span className="text-white font-bold">AI-powered 2-minute setup via your website URL.</span>
                  </p>
                  <p className="text-sm text-slate-400 mb-5">
                    Paste your existing website and let Marcan's AI scraper build a comprehensive supplier profile for you.
                  </p>

                  {/* Website URL under Supplier option */}
                  <div className="mt-4">
                    <label className="text-sm font-bold text-slate-300 uppercase mb-2 block text-left">
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
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-marcan-red focus:shadow-neon"
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
                        className="sm:w-14 bg-marcan-red text-white px-0 py-0 rounded-lg font-bold text-sm uppercase tracking-widest hover:shadow-neon hover:scale-[1.05] transition-all duration-300 whitespace-nowrap flex items-center justify-center"
                        aria-label="Start supplier setup"
                      >
                        <i className="fa-solid fa-arrow-right"></i>
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-slate-400 text-left mb-2">
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

              <p className="text-sm text-slate-500 mt-2">
                Already a member?{' '}
                <Link href="/login" className="text-marcan-red font-bold hover:text-white transition-colors ml-1">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
