import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../locales/en.json';
import kn from '../locales/kn.json';
import ta from '../locales/ta.json';
import ml from '../locales/ml.json';
import hi from '../locales/hi.json';

export type SupportedLanguage = 'en' | 'kn' | 'ta' | 'ml' | 'hi';

const translations: Record<SupportedLanguage, Record<string, string>> = {
  en,
  kn,
  ta,
  ml,
  hi,
};

interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: async () => {},
  t: (key: string) => key,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  useEffect(() => {
    AsyncStorage.getItem('app_language').then((saved) => {
      if (saved && ['en', 'kn', 'ta', 'ml', 'hi'].includes(saved)) {
        setLanguageState(saved as SupportedLanguage);
      }
    });
  }, []);

  const setLanguage = async (lang: SupportedLanguage) => {
    setLanguageState(lang);
    await AsyncStorage.setItem('app_language', lang);
  };

  const t = (key: string): string => {
    const current = translations[language];
    return (current && current[key]) || translations.en[key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);