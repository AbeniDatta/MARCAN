'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import { useI18n } from '@/contexts/I18nContext';

export default function HelpPageClient() {
  const { t, translateText } = useI18n();

  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb={translateText('Support')} />

      <div className="flex-1 overflow-y-auto page-scroll relative">
        <div className="max-w-5xl mx-auto w-full min-w-0 py-6">
          <div className="text-center mb-8">
            <i className="fa-solid fa-life-ring text-4xl sm:text-5xl text-marcan-red mb-4 shadow-neon rounded-full p-4 bg-white/5"></i>
            <h2 className="font-heading text-3xl sm:text-4xl font-black text-white uppercase tracking-tight mb-3 px-2">{t('help.title')}</h2>
            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto px-2">{t('help.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="glass-card p-5 sm:p-8 rounded-2xl border border-white/5">
                <h3 className="font-bold text-xl text-white mb-6 flex items-center gap-3">
                  <i className="fa-solid fa-clipboard-question text-marcan-red"></i> {t('help.faqHeading')}
                </h3>

                <div className="space-y-4">
                  <details className="group bg-black/20 rounded-lg p-4 cursor-pointer">
                    <summary className="flex justify-between items-center font-bold text-white text-sm list-none">
                      {t('help.q1')}
                      <span className="transition group-open:rotate-180">
                        <i className="fa-solid fa-chevron-down text-xs text-slate-500"></i>
                      </span>
                    </summary>
                    <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                      {t('help.a1p1')}
                      <Link href="/directory" className="text-marcan-red font-semibold hover:text-white underline underline-offset-2">
                        {t('sidebar.directory')}
                      </Link>
                      {t('help.a1p2')}
                      <Link href="/shop" className="text-marcan-red font-semibold hover:text-white underline underline-offset-2">
                        {t('sidebar.shop')}
                      </Link>
                      {t('help.a1p3')}
                    </p>
                  </details>

                  <details className="group bg-black/20 rounded-lg p-4 cursor-pointer">
                    <summary className="flex justify-between items-center font-bold text-white text-sm list-none">
                      {t('help.q2')}
                      <span className="transition group-open:rotate-180">
                        <i className="fa-solid fa-chevron-down text-xs text-slate-500"></i>
                      </span>
                    </summary>
                    <p className="text-slate-400 text-sm mt-3 leading-relaxed">{t('help.a2')}</p>
                  </details>

                  <details className="group bg-black/20 rounded-lg p-4 cursor-pointer">
                    <summary className="flex justify-between items-center font-bold text-white text-sm list-none">
                      {t('help.q3')}
                      <span className="transition group-open:rotate-180">
                        <i className="fa-solid fa-chevron-down text-xs text-slate-500"></i>
                      </span>
                    </summary>
                    <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                      {t('help.a3p1')}
                      <span className="font-semibold text-slate-300">{t('help.a3buyer')}</span>
                      {t('help.a3p2')}
                      <span className="font-semibold text-slate-300">{t('help.a3supplier')}</span>
                      {t('help.a3p3')}
                      <span className="font-semibold text-slate-300">{t('help.a3storefront')}</span>
                      {t('help.a3p4')}
                      <Link href="/signup" className="text-marcan-red font-semibold hover:text-white underline underline-offset-2">
                        {t('sidebar.signUp')}
                      </Link>
                      {t('help.a3p5')}
                    </p>
                  </details>

                  <details className="group bg-black/20 rounded-lg p-4 cursor-pointer">
                    <summary className="flex justify-between items-center font-bold text-white text-sm list-none">
                      {t('help.q4')}
                      <span className="transition group-open:rotate-180">
                        <i className="fa-solid fa-chevron-down text-xs text-slate-500"></i>
                      </span>
                    </summary>
                    <p className="text-slate-400 text-sm mt-3 leading-relaxed">{t('help.a4')}</p>
                  </details>

                  <details className="group bg-black/20 rounded-lg p-4 cursor-pointer">
                    <summary className="flex justify-between items-center font-bold text-white text-sm list-none">
                      {t('help.q5')}
                      <span className="transition group-open:rotate-180">
                        <i className="fa-solid fa-chevron-down text-xs text-slate-500"></i>
                      </span>
                    </summary>
                    <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                      {t('help.a5p1')}
                      <Link href="/directory" className="text-marcan-red font-semibold hover:text-white underline underline-offset-2">
                        {t('sidebar.directory')}
                      </Link>
                      {t('help.a5p2')}
                    </p>
                  </details>

                  <details className="group bg-black/20 rounded-lg p-4 cursor-pointer">
                    <summary className="flex justify-between items-center font-bold text-white text-sm list-none">
                      {t('help.q6')}
                      <span className="transition group-open:rotate-180">
                        <i className="fa-solid fa-chevron-down text-xs text-slate-500"></i>
                      </span>
                    </summary>
                    <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                      {t('help.a6p1')}
                      <Link href="/signup" className="text-marcan-red font-semibold hover:text-white underline underline-offset-2">
                        {t('sidebar.signUp')}
                      </Link>
                      {t('help.a6p2')}
                    </p>
                  </details>

                  <details className="group bg-black/20 rounded-lg p-4 cursor-pointer">
                    <summary className="flex justify-between items-center font-bold text-white text-sm list-none">
                      {t('help.q7')}
                      <span className="transition group-open:rotate-180">
                        <i className="fa-solid fa-chevron-down text-xs text-slate-500"></i>
                      </span>
                    </summary>
                    <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                      {t('help.a7p1')}
                      <span className="font-semibold text-slate-300">https://</span>
                      {t('help.a7p2')}
                    </p>
                  </details>

                  <details className="group bg-black/20 rounded-lg p-4 cursor-pointer">
                    <summary className="flex justify-between items-center font-bold text-white text-sm list-none">
                      {t('help.q8')}
                      <span className="transition group-open:rotate-180">
                        <i className="fa-solid fa-chevron-down text-xs text-slate-500"></i>
                      </span>
                    </summary>
                    <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                      {t('help.a8p1')}
                      <Link href="/become-supplier?start=manual" className="text-marcan-red font-semibold hover:text-white underline underline-offset-2">
                        {t('signup.pathPicker.manualLinkLabel')}
                      </Link>
                      {t('help.a8p2')}
                    </p>
                  </details>

                  <details className="group bg-black/20 rounded-lg p-4 cursor-pointer">
                    <summary className="flex justify-between items-center font-bold text-white text-sm list-none">
                      {t('help.q9')}
                      <span className="transition group-open:rotate-180">
                        <i className="fa-solid fa-chevron-down text-xs text-slate-500"></i>
                      </span>
                    </summary>
                    <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                      {t('help.a9p1')}
                      <Link href="/post-request" className="text-marcan-red font-semibold hover:text-white underline underline-offset-2">
                        {t('header.breadcrumbPostRequest')}
                      </Link>
                      {t('help.a9p2')}
                      <span className="font-semibold text-slate-300">{t('header.myAccount')}</span>
                      {t('help.a9p3')}
                    </p>
                  </details>

                  <details className="group bg-black/20 rounded-lg p-4 cursor-pointer">
                    <summary className="flex justify-between items-center font-bold text-white text-sm list-none">
                      {t('help.q10')}
                      <span className="transition group-open:rotate-180">
                        <i className="fa-solid fa-chevron-down text-xs text-slate-500"></i>
                      </span>
                    </summary>
                    <p className="text-slate-400 text-sm mt-3 leading-relaxed">{t('help.a10')}</p>
                  </details>

                  <details className="group bg-black/20 rounded-lg p-4 cursor-pointer">
                    <summary className="flex justify-between items-center font-bold text-white text-sm list-none">
                      {t('help.q11')}
                      <span className="transition group-open:rotate-180">
                        <i className="fa-solid fa-chevron-down text-xs text-slate-500"></i>
                      </span>
                    </summary>
                    <p className="text-slate-400 text-sm mt-3 leading-relaxed">{t('help.a11')}</p>
                  </details>

                  <details className="group bg-black/20 rounded-lg p-4 cursor-pointer">
                    <summary className="flex justify-between items-center font-bold text-white text-sm list-none">
                      {t('help.q12')}
                      <span className="transition group-open:rotate-180">
                        <i className="fa-solid fa-chevron-down text-xs text-slate-500"></i>
                      </span>
                    </summary>
                    <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                      {t('help.a12p1')}
                      <Link href="/contact" className="text-marcan-red font-semibold hover:text-white underline underline-offset-2">
                        {t('sidebar.contact')}
                      </Link>
                      {t('help.a12p2')}
                    </p>
                  </details>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl">
                <h4 className="font-bold text-white mb-4 text-sm uppercase">{t('help.resourcesTitle')}</h4>
                <ul className="space-y-3">
                  <li>
                    <Link href="/terms" className="text-slate-400 text-sm hover:text-marcan-red flex items-center gap-2">
                      <i className="fa-solid fa-gavel"></i> {t('help.termsOfService')}
                    </Link>
                  </li>
                  <li>
                    <span className="text-slate-400 text-sm flex items-center gap-2 opacity-60">
                      <i className="fa-solid fa-video"></i> {t('help.videoTutorials')}
                      <span className="text-xs bg-slate-700/50 px-2 py-0.5 rounded">{t('help.comingSoon')}</span>
                    </span>
                  </li>
                  <li>
                    <span className="text-slate-400 text-sm flex items-center gap-2 opacity-60">
                      <i className="fa-regular fa-file-pdf"></i> {t('help.userManualPdf')}
                      <span className="text-xs bg-slate-700/50 px-2 py-0.5 rounded">{t('help.comingSoon')}</span>
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
