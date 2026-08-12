import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

// Messages are shared with the web frontend
// Using require for dynamic JSON loading in React Native
// eslint-disable-next-line @typescript-eslint/no-require-imports
const en = require('../messages/en.json');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fr = require('../messages/fr.json');

i18next.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  interpolation: { escapeValue: false },
});

export default i18next;
