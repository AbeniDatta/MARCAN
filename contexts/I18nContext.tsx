'use client';

import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';

type Lang = 'en' | 'fr';

type Messages = typeof en;

const resources: Record<Lang, Messages> = {
  en,
  fr,
};

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      t: (key: string) => {
        const parts = key.split('.');
        let current: any = resources[lang];
        for (const part of parts) {
          if (current == null) break;
          current = current[part];
        }
        return typeof current === 'string' ? current : key;
      },
    }),
    [lang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}

