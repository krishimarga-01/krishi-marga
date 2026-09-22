import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../locales/en.json';
import kn from '../locales/kn.json';
import ta from '../locales/ta.json';
import ml from '../locales/ml.json';
import hi from '../locales/hi.json';
import te from '../locales/te.json';

export type SupportedLanguage = 'en' | 'kn' | 'ta' | 'ml' | 'hi' | 'te';

const translations: Record<SupportedLanguage, Record<string, string>> = {
  en,
  kn,
  ta,
  ml,
  hi,
  te,
};

interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: async () => {},
  t: (key: string, params?: Record<string, string | number>) => key,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  useEffect(() => {
    AsyncStorage.getItem('app_language').then((saved) => {
      if (saved && ['en', 'kn', 'ta', 'ml', 'hi', 'te'].includes(saved)) {
        setLanguageState(saved as SupportedLanguage);
      }
    });
  }, []);

  const setLanguage = async (lang: SupportedLanguage) => {
    setLanguageState(lang);
    await AsyncStorage.setItem('app_language', lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const current = translations[language];
    let text = '';
    if (current && current[key]) {
      text = current[key];
    } else {
      if (__DEV__) {
        console.warn(`[i18n] Missing translation key "${key}" for language "${language}"`);
      }
      text = (translations.en && translations.en[key]) || key;
    }

    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
      });
    }

    return text;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);