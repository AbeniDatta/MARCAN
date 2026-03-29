'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useI18n } from '@/contexts/I18nContext';

export default function SignupPage() {
  const router = useRouter();
  const { t, translateText } = useI18n();
  const [supplierWebsite, setSupplierWebsite] = useState('');
  const [supplierWebsiteError, setSupplierWebsiteError] = useState('');

  const supplierUrlErrorMessage = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
        ? ''
        : t('signup.joinSupplier.invalidUrl');
    } catch {
      return t('signup.joinSupplier.invalidUrl');
    }
  };

  const handleJoinBuyer = () => {
    router.push('/signup/buyer');
  };

  const handleJoinSupplier = () => {
    const trimmed = supplierWebsite.trim();
    if (trimmed) {
      const msg = supplierUrlErrorMessage(supplierWebsite);
      if (msg) {
        setSupplierWebsiteError(msg);
        return;
      }
    }
    setSupplierWebsiteError('');
    const base = '/become-supplier?start=import';
    const urlParam = trimmed ? `&url=${encodeURIComponent(trimmed)}` : '';
    router.push(`${base}${urlParam}`);
  };

  const handleJoinStorefront = () => {
    router.push('/become-seller?step=0');
  };

  return (
    <main className="flex-1 relative z-10 overflow-y-auto flex flex-col">
      <Header breadcrumb={translateText('Sign Up')} />

      <div className="flex-1 overflow-y-auto p-4 relative">
        <div className="flex items-center justify-center py-8">
          <div className="w-full max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="font-heading text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-4">
                {t('signup.pathPicker.title')}
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
                {t('signup.pathPicker.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch max-w-5xl mx-auto relative z-10">
              {/* Buyer Account */}
              <div
                className="glass-card rounded-3xl border border-white/5 p-8 flex flex-col text-left hover:border-blue-500/50 hover:-translate-y-2 transition-all duration-300 bg-gradient-to-b from-transparent to-blue-900/5"
              >
                <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-2xl mb-6 border border-blue-500/20">
                  <i className="fa-solid fa-magnifying-glass-chart" />
                </div>
                <h3 className="font-heading font-black text-2xl text-white mb-2 uppercase tracking-wide">
                  {t('signup.tree.q1.sourceTitle')}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-8 h-10">
                  {t('signup.tree.q1.sourceBody')}
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <i className="fa-solid fa-check text-blue-400 mt-1 text-sm" />
                    <span className="text-sm text-slate-300">{t('signup.pathPicker.buyerBullet1')}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <i className="fa-solid fa-check text-blue-400 mt-1 text-sm" />
                    <span className="text-sm text-slate-300">{t('signup.pathPicker.buyerBullet2')}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <i className="fa-solid fa-check text-blue-400 mt-1 text-sm" />
                    <span className="text-sm text-slate-300">{t('signup.pathPicker.buyerBullet3')}</span>
                  </div>
                  <div className="flex items-start gap-3">

                  </div>
                </div>

                <div className="mt-14 space-y-3 pt-10 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleJoinBuyer}
                    className="w-full py-3.5 rounded-xl border border-blue-500/30 text-blue-400 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:bg-blue-500/10 transition-colors"
                  >
                    {t('signup.pathPicker.joinBuyerCta')} <i className="fa-solid fa-arrow-right opacity-60" />
                  </button>
                </div>
              </div>

              {/* Verified Supplier */}
              <div
                className="glass-card rounded-3xl border border-marcan-red/30 p-8 flex flex-col text-left hover:-translate-y-2 transition-all duration-300 relative shadow-[0_0_30px_rgba(239,68,68,0.1)] bg-gradient-to-b from-marcan-red/10 to-transparent"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-marcan-red to-orange-500 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-neon whitespace-nowrap">
                  {t('signup.pathPicker.supplierBadge')}
                </div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-marcan-red to-orange-500 flex items-center justify-center text-white text-2xl mb-6 border border-white/20">
                  <i className="fa-solid fa-industry" />
                </div>
                <h3 className="font-heading font-black text-2xl text-white mb-2 uppercase tracking-wide">
                  {t('signup.pathPicker.supplierTitle')}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-8 h-10">
                  {t('signup.pathPicker.supplierSubtitle')}
                </p>
                <div className="space-y-3 mb-8 flex-grow">
                  <div className="flex items-start gap-3">
                    <i className="fa-solid fa-check text-marcan-red mt-1 text-sm" />
                    <span className="text-sm text-white font-medium">{t('signup.pathPicker.supplierBullet1')}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <i className="fa-solid fa-check text-marcan-red mt-1 text-sm" />
                    <span className="text-sm text-slate-300">{t('signup.pathPicker.supplierBullet2')}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <i className="fa-solid fa-check text-marcan-red mt-1 text-sm" />
                    <span className="text-sm text-slate-300">{t('signup.pathPicker.supplierBullet3')}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <i className="fa-solid fa-check text-marcan-red mt-1 text-sm" />
                    <span className="text-sm text-slate-300">{t('signup.pathPicker.supplierBullet4')}</span>
                  </div>
                </div>

                <div className="mt-auto space-y-3 pt-4 border-t border-white/10">
                  <label className="text-sm font-bold text-slate-300 uppercase block text-left">
                    {t('signup.joinSupplier.websiteUrlLabel')}
                  </label>
                  <div className="flex gap-2 items-stretch">
                    <input
                      type="url"
                      value={supplierWebsite}
                      onChange={(e) => {
                        const v = e.target.value;
                        setSupplierWebsite(v);
                        setSupplierWebsiteError(supplierUrlErrorMessage(v));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleJoinSupplier();
                        }
                      }}
                      placeholder={t('signup.joinSupplier.websiteUrlPlaceholder')}
                      className={`min-w-0 flex-1 bg-black/30 rounded-lg px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 border ${supplierWebsiteError
                        ? 'border-red-500/40 focus:border-red-500'
                        : 'border-white/10 focus:border-marcan-red'
                        } focus:shadow-neon`}
                    />
                    <button
                      type="button"
                      onClick={handleJoinSupplier}
                      disabled={!!supplierWebsiteError}
                      className="shrink-0 px-4 rounded-lg bg-gradient-to-r from-marcan-red to-orange-500 text-white flex items-center justify-center hover:shadow-neon transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      aria-label={t('signup.joinSupplier.title')}
                    >
                      <i className="fa-solid fa-arrow-right" />
                    </button>
                  </div>
                  {supplierWebsiteError && (
                    <div className="text-[11px] text-red-400 text-left">{supplierWebsiteError}</div>
                  )}
                  <p className="text-xs text-slate-400 text-left">
                    {t('signup.joinSupplier.manualFillTextPrefix')}
                    <button
                      type="button"
                      onClick={() => router.push('/become-supplier?start=manual')}
                      className="text-marcan-red font-bold hover:text-white underline underline-offset-4 ml-1"
                    >
                      {t('signup.joinSupplier.manualFillTextLink')}
                    </button>
                    .
                  </p>
                </div>
              </div>

              {/* Storefront Seller */}
              <div
                className="glass-card rounded-3xl border border-white/5 p-8 flex flex-col text-left hover:border-orange-500/50 hover:-translate-y-2 transition-all duration-300 bg-gradient-to-b from-transparent to-orange-900/5"
              >
                <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 text-2xl mb-6 border border-orange-500/20">
                  <i className="fa-solid fa-store" />
                </div>
                <h3 className="font-heading font-black text-2xl text-white mb-2 uppercase tracking-wide">
                  {t('signup.pathPicker.storefrontTitle')}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-8 h-10">
                  {t('signup.pathPicker.storefrontSubtitle')}
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <i className="fa-solid fa-check text-orange-400 mt-1 text-sm" />
                    <span className="text-sm text-slate-300">{t('signup.pathPicker.storefrontBullet1')}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <i className="fa-solid fa-check text-orange-400 mt-1 text-sm" />
                    <span className="text-sm text-slate-300">{t('signup.pathPicker.storefrontBullet2')}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <i className="fa-solid fa-check text-orange-400 mt-1 text-sm" />
                    <span className="text-sm text-slate-300">{t('signup.pathPicker.storefrontBullet3')}</span>
                  </div>
                  <div className="flex items-start gap-3">

                  </div>
                </div>


                <div className="mt-14 space-y-3 pt-10 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleJoinStorefront}
                    className="w-full py-3.5 rounded-xl border border-orange-500/30 text-orange-400 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:bg-orange-500/10 transition-colors"
                  >
                    {t('signup.pathPicker.joinSellerCta')} <i className="fa-solid fa-arrow-right opacity-60" />
                  </button>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-500 mt-10 text-center">
              {t('signup.alreadyMemberPrefix')}{' '}
              <Link href="/login" className="text-marcan-red font-bold hover:text-white transition-colors ml-1">
                {t('signup.loginLinkText')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
