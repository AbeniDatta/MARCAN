'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useI18n } from '@/contexts/I18nContext';

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useI18n();
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
                {t('signup.title')}
              </h2>
              <p className="text-sm text-slate-500 mb-4 max-w-xl mx-auto">
                {t('signup.subtitle')}
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
                        {t('signup.joinBuyer.title')}
                      </h3>
                    </div>
                  </div>
                  <p className="text-base text-slate-300 leading-relaxed mb-3">
                    {t('signup.joinBuyer.desc1')}
                  </p>
                  <p className="text-sm text-slate-400 mb-5">
                    {t('signup.joinBuyer.desc2')}
                  </p>

                  {/* Email field under Option A */}
                  <div className="mt-4">
                    <label className="text-sm font-bold text-slate-400 uppercase mb-2 block text-left">
                      {t('signup.joinBuyer.workEmailLabel')}
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
                              setError(t('signup.joinBuyer.errorEmailRequired'));
                              return;
                            }
                            router.push(`/signup/buyer?email=${encodeURIComponent(choiceEmail.trim())}`);
                          }
                        }}
                        placeholder={t('signup.joinBuyer.workEmailPlaceholder')}
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-marcan-red focus:shadow-neon"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!choiceEmail.trim()) {
                            setError(t('signup.joinBuyer.errorEmailRequired'));
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
                      {t('signup.joinBuyer.prefillText')}
                    </p>
                  </div>
                </div>

                {/* Option B: Supplier / Supplier */}
                <div className="group glass-card border border-marcan-red/50 bg-marcan-red/5 hover:bg-marcan-red/10 rounded-3xl p-8 text-left transition-all duration-300 h-full flex flex-col">
                  <div className="flex items-center gap-5 mb-4">
                    <div className="w-20 h-20 rounded-full bg-marcan-red/20 flex items-center justify-center text-marcan-red">
                      <i className="fa-solid fa-industry text-2xl"></i>
                    </div>
                    <div>
                      <h3 className="text-white font-heading font-bold text-2xl">
                        {t('signup.joinSupplier.title')}
                      </h3>
                    </div>
                  </div>
                  <p className="text-base text-slate-300 leading-relaxed mb-3">
                    {t('signup.joinSupplier.desc1')}
                  </p>
                  <p className="text-sm text-slate-400 mb-5">
                    {t('signup.joinSupplier.desc2')}
                  </p>

                  {/* Website URL under Supplier option */}
                  <div className="mt-4">
                    <label className="text-sm font-bold text-slate-300 uppercase mb-2 block text-left">
                      {t('signup.joinSupplier.websiteUrlLabel')}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                      <input
                        type="url"
                        value={supplierWebsite}
                        onChange={(e) => setSupplierWebsite(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const base = '/become-supplier?start=import';
                            const urlParam = supplierWebsite.trim()
                              ? `&url=${encodeURIComponent(supplierWebsite.trim())}`
                              : '';
                            router.push(`${base}${urlParam}`);
                          }
                        }}
                        placeholder={t('signup.joinSupplier.websiteUrlPlaceholder')}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-marcan-red focus:shadow-neon"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const base = '/become-supplier?start=import';
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
                      {t('signup.joinSupplier.manualFillTextPrefix')}
                      <button
                        type="button"
                        onClick={() => router.push('/become-supplier?start=manual')}
                        className="text-marcan-red font-bold hover:text-white underline underline-offset-4"
                      >
                        {t('signup.joinSupplier.manualFillTextLink')}
                      </button>
                      .
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-500 mt-2">
                {t('signup.joinSupplier.alreadyMemberPrefix')}{' '}
                <Link href="/login" className="text-marcan-red font-bold hover:text-white transition-colors ml-1">
                  {t('signup.joinSupplier.loginLinkText')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
