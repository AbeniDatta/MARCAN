'use client';

import { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';

export default function DevelopmentDisclaimer() {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <div
      className="relative bg-gradient-to-r from-orange-500/10 via-marcan-red/10 to-orange-500/10 border-t border-white/5 py-2 px-10 sm:px-12 pb-[max(0.5rem,env(safe-area-inset-bottom))] shrink-0 z-40 backdrop-blur-md flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-center gap-2 sm:gap-2.5 min-w-0 max-w-[min(100%,calc(100vw-5rem))]">
        <span className="flex h-2 w-2 relative shrink-0 mt-px" aria-hidden>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
        </span>
        <p className="text-[10px] md:text-xs font-bold text-orange-400 uppercase tracking-widest text-left sm:text-center min-w-0 leading-snug">
          <span className="text-white">{t('layout.developerPreviewLabel')}</span>{' '}
          {t('layout.developmentDisclaimerBody')}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 shrink-0 p-1 text-slate-500 hover:text-white transition-colors"
        aria-label={t('layout.dismissDisclaimerAria')}
      >
        <i className="fa-solid fa-xmark text-[10px] sm:text-[11px]" aria-hidden />
      </button>
    </div>
  );
}
