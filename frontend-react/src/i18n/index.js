import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import vi from './vi.json';
import en from './en.json';

i18n
  .use(LanguageDetector)       // detect browser language
  .use(initReactI18next)       // bind to React
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en },
    },
    fallbackLng: 'vi',          // default to Vietnamese
    supportedLngs: ['vi', 'en'],
    detection: {
      // Check localStorage first, then browser language
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: {
      escapeValue: false,       // React already escapes
    },
    ns: ['translation'],
    defaultNS: 'translation',
  });

export default i18n;
