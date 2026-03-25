'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
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
  translateText: (value: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');

  // Map EN leaf-string values -> FR leaf-string values based on matching key paths.
  // This lets us translate UI breadcrumbs/titles that are passed as raw English strings.
  const valueMap = useMemo(() => {
    const map = new Map<string, string>();

    const visit = (enNode: any, frNode: any) => {
      if (typeof enNode === 'string' && typeof frNode === 'string') {
        map.set(enNode, frNode);
        return;
      }
      if (enNode == null || frNode == null) return;
      if (typeof enNode !== 'object' || typeof frNode !== 'object') return;

      for (const key of Object.keys(enNode)) {
        if (!(key in frNode)) continue;
        visit(enNode[key], frNode[key]);
      }
    };

    visit(en, fr);
    return map;
  }, []);

  const setLangAndPersist = (nextLang: Lang) => {
    setLang(nextLang);
    try {
      localStorage.setItem('marcan-lang', nextLang);
    } catch {
      // Ignore storage failures (e.g. privacy mode).
    }
  };

  // Restore language preference across page reloads.
  useEffect(() => {
    try {
      const stored = localStorage.getItem('marcan-lang');
      if (stored === 'en' || stored === 'fr') setLang(stored);
    } catch {
      // Ignore storage failures.
    }
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang: setLangAndPersist,
      t: (key: string) => {
        const parts = key.split('.');
        let current: any = resources[lang];
        for (const part of parts) {
          if (current == null) break;
          current = current[part];
        }
        return typeof current === 'string' ? current : key;
      },
      translateText: (raw: string) => {
        if (lang === 'en') return raw;
        return valueMap.get(raw) ?? raw;
      },
    }),
    [lang, valueMap]
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

