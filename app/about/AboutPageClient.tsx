'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import { useI18n } from '@/contexts/I18nContext';

const UW_ENGINEERING_URL = 'https://uwaterloo.ca/engineering/';
const NGEN_URL = 'https://www.ngen.ca/';

export default function AboutPageClient() {
  const { t, translateText } = useI18n();

  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb={translateText('About Us')} />

      <div className="flex-1 overflow-y-auto p-6 md:p-8 relative">
        <div className="max-w-6xl mx-auto py-4">
          <div className="text-center mb-8">
            <i className="fa-solid fa-people-group text-5xl text-marcan-red mb-4 shadow-neon rounded-full p-4 bg-white/5"></i>
            <h2 className="font-heading text-4xl font-black text-white uppercase tracking-tight mb-3">{t('about.heroTitle')}</h2>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">{t('about.heroSubtitle')}</p>
          </div>
          <section className="glass-card rounded-3xl border border-white/5 overflow-hidden mb-12 flex flex-col lg:flex-row">
            <div className="lg:w-5/12 p-10 md:p-12 bg-black/20 border-r border-white/5 relative">
              <i className="fa-solid fa-users absolute top-10 right-10 text-6xl text-white/5 pointer-events-none" />
              <h3 className="text-marcan-red text-xs font-bold uppercase tracking-widest mb-4">{t('about.originsLabel')}</h3>
              <h2 className="font-heading text-3xl font-black text-white uppercase tracking-wide mb-6">{t('about.whoWeAreTitle')}</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                {t('about.whoWeAreBodyPrefix')}
                <a
                  href={UW_ENGINEERING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-white underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-marcan-red rounded-sm"
                >
                  {t('about.whoWeAreBodyBold')}
                </a>
                {t('about.whoWeAreBodySuffix')}
              </p>
            </div>

            <div className="lg:w-7/12 p-10 md:p-12 relative overflow-hidden bg-gradient-to-br from-white/5 to-transparent">
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">{t('about.credibilityLabel')}</h3>
              <h2 className="font-heading text-2xl font-bold text-white uppercase tracking-wide mb-2">{t('about.supportedByTitle')}</h2>
              <p className="text-slate-400 text-xs mb-8 max-w-md">{t('about.supportedBySubtitle')}</p>

              <div className="grid sm:grid-cols-2 gap-4">
                <a
                  href={UW_ENGINEERING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-black/40 border border-white/10 rounded-xl p-5 flex items-center gap-4 group hover:border-marcan-red/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-marcan-red"
                  aria-label={`${t('about.partnerUw')}, ${t('about.partnerUwSub')}`}
                >
                  <div className="w-12 h-12 rounded-lg bg-marcan-red/10 flex items-center justify-center text-marcan-red shadow-neon shrink-0">
                    <i className="fa-solid fa-building-columns text-xl" aria-hidden />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm leading-tight group-hover:text-marcan-red transition-colors">
                      {t('about.partnerUw')}
                    </div>
                    <div className="text-slate-500 text-[10px] uppercase tracking-wider mt-1">{t('about.partnerUwSub')}</div>
                  </div>
                </a>

                <a
                  href={NGEN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-black/40 border border-white/10 rounded-xl p-5 flex items-center gap-4 group hover:border-blue-500/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label={`${t('about.partnerNgen')}, ${t('about.partnerNgenSub')}`}
                >
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] shrink-0">
                    <i className="fa-solid fa-industry text-xl" aria-hidden />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm leading-tight group-hover:text-blue-300 transition-colors">
                      {t('about.partnerNgen')}
                    </div>
                    <div className="text-slate-500 text-[10px] uppercase tracking-wider mt-1">{t('about.partnerNgenSub')}</div>
                  </div>
                </a>
              </div>
            </div>
          </section>

          <section className="grid md:grid-cols-2 gap-8 mb-10">
            <div className="glass-card p-10 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-marcan-red/30 transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
              <i className="fa-solid fa-link-slash text-4xl text-slate-700 group-hover:text-marcan-red transition-colors mb-6 relative z-10" />
              <h3 className="font-heading text-2xl font-black text-white mb-4 uppercase tracking-wide relative z-10">{t('about.whyTitle')}</h3>
              <p className="text-slate-400 leading-relaxed text-sm relative z-10">{t('about.whyBody')}</p>
            </div>

            <div className="glass-card p-10 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-orange-500/30 transition-all duration-500 bg-gradient-to-br from-white/5 to-transparent">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
              <i className="fa-solid fa-eye text-4xl text-slate-700 group-hover:text-orange-500 transition-colors mb-6 relative z-10" />
              <h3 className="font-heading text-2xl font-black text-white mb-4 uppercase tracking-wide relative z-10">{t('about.visionTitle')}</h3>
              <p className="text-slate-400 leading-relaxed text-sm relative z-10">{t('about.visionBody')}</p>
            </div>
          </section>

          <section className="mb-12">
            <div className="text-center mb-8">
              <h3 className="text-marcan-red text-xs font-bold uppercase tracking-widest mb-2">{t('about.frameworkLabel')}</h3>
              <h2 className="font-heading text-3xl font-black text-white uppercase tracking-wide">{t('about.whatWeDoTitle')}</h2>
              <p className="text-slate-400 text-sm mt-2 max-w-2xl mx-auto">{t('about.whatWeDoSubtitle')}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-card p-8 rounded-2xl border border-white/5 hover:-translate-y-2 hover:border-marcan-red/40 transition-all duration-300 group">
                <div className="w-14 h-14 rounded-xl bg-black/40 flex items-center justify-center text-marcan-red text-2xl mb-6 shadow-inner border border-white/10 group-hover:bg-marcan-red/10 group-hover:shadow-neon transition-all">
                  <i className="fa-solid fa-magnifying-glass" />
                </div>
                <h4 className="font-bold text-white mb-3 uppercase text-sm tracking-wide">{t('about.card1Title')}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{t('about.card1Body')}</p>
              </div>

              <div className="glass-card p-8 rounded-2xl border border-white/5 hover:-translate-y-2 hover:border-orange-500/40 transition-all duration-300 group">
                <div className="w-14 h-14 rounded-xl bg-black/40 flex items-center justify-center text-orange-500 text-2xl mb-6 shadow-inner border border-white/10 group-hover:bg-orange-500/10 group-hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all">
                  <i className="fa-solid fa-list-check" />
                </div>
                <h4 className="font-bold text-white mb-3 uppercase text-sm tracking-wide">{t('about.card2Title')}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{t('about.card2Body')}</p>
              </div>

              <div className="glass-card p-8 rounded-2xl border border-white/5 hover:-translate-y-2 hover:border-blue-500/40 transition-all duration-300 group">
                <div className="w-14 h-14 rounded-xl bg-black/40 flex items-center justify-center text-blue-500 text-2xl mb-6 shadow-inner border border-white/10 group-hover:bg-blue-500/10 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">
                  <i className="fa-solid fa-bolt" />
                </div>
                <h4 className="font-bold text-white mb-3 uppercase text-sm tracking-wide">{t('about.card3Title')}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{t('about.card3Body')}</p>
              </div>
            </div>
          </section>

          <section className="glass-card p-10 md:p-12 rounded-3xl border border-marcan-red/20 bg-gradient-to-r from-marcan-red/10 via-marcan-dark to-transparent relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-marcan-red shadow-neon" />
            <div className="relative z-10 max-w-2xl text-center md:text-left">
              <h2 className="font-heading text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-3">{t('about.ctaTitle')}</h2>
              <p className="text-slate-400 text-sm">{t('about.ctaBody')}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 relative z-10 shrink-0 w-full md:w-auto">
              <Link
                href="/signup"
                className="bg-marcan-red text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:shadow-neon hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-center"
              >
                <i className="fa-solid fa-user-plus" /> {t('about.ctaSignUp')}
              </Link>
              <Link
                href="/contact"
                className="bg-white/5 border border-white/10 text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 hover:-translate-y-1 transition-all text-center"
              >
                {t('about.ctaContact')}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
