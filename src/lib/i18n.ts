import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import idTranslation from '../locales/id.json';
import enTranslation from '../locales/en.json';
import trTranslation from '../locales/tr.json';

const resources = {
  id: { translation: idTranslation },
  en: { translation: enTranslation },
  tr: { translation: trTranslation }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'id',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
