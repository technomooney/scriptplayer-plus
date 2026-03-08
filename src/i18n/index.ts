import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

import en from './locales/en';
import ko from './locales/ko';
import ja from './locales/ja';
import zh from './locales/zh';

export const SUPPORTED_LOCALES = ['en', 'ko', 'ja', 'zh'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

const LOCALE_STORAGE_KEY = 'handycontrol-locale';

const messages: Record<Locale, Record<string, string>> = {
  en,
  ko,
  ja,
  zh,
};

function detectLocale(): Locale {
  // Check localStorage first
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
      return stored as Locale;
    }
  } catch {
    // localStorage may not be available
  }

  // Detect from browser language
  const browserLang = navigator.language ?? 'en';
  const langCode = browserLang.split('-')[0].toLowerCase();

  if (SUPPORTED_LOCALES.includes(langCode as Locale)) {
    return langCode as Locale;
  }

  return 'en';
}

interface I18nContextValue {
  t: (key: string, params?: Record<string, string>) => string;
  locale: string;
  setLocale: (locale: string) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return ctx;
}

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = useCallback((newLocale: string) => {
    if (SUPPORTED_LOCALES.includes(newLocale as Locale)) {
      setLocaleState(newLocale as Locale);
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
      } catch {
        // localStorage may not be available
      }
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string>): string => {
      let value = messages[locale]?.[key] ?? messages.en[key] ?? key;

      // Interpolate {param} placeholders
      if (params) {
        for (const [paramKey, paramValue] of Object.entries(params)) {
          value = value.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), paramValue);
        }
      }

      return value;
    },
    [locale]
  );

  const contextValue = useMemo(
    () => ({ t, locale, setLocale }),
    [t, locale, setLocale]
  );

  return React.createElement(I18nContext.Provider, { value: contextValue }, children);
}

export { I18nContext };
export default { I18nProvider, useTranslation, SUPPORTED_LOCALES };
