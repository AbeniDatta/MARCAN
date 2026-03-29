'use client';

import { useI18n } from '@/contexts/I18nContext';

export default function DevelopmentDisclaimer() {
  const { t } = useI18n();

  return (
    <div
      className="bg-gradient-to-r from-orange-500/10 via-marcan-red/10 to-orange-500/10 border-t border-white/5 py-2 px-4 flex items-center justify-center gap-3 shrink-0 z-40 backdrop-blur-md"
      role="status"
      aria-live="polite"
    >
      <span className="flex h-2 w-2 relative shrink-0" aria-hidden>
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
      </span>
      <p className="text-[10px] md:text-xs font-bold text-orange-400 uppercase tracking-widest text-center">
        <span className="text-white">{t('layout.developerPreviewLabel')}</span>{' '}
        {t('layout.developmentDisclaimerBody')}
      </p>
    </div>
  );
}
