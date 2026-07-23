import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18N_NS, createAddResourceBundle } from '@/shared/utils/i18n';

export { I18N_NS };

export const addResourceBundle = createAddResourceBundle(i18n);

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    fallbackLng: 'en',
    defaultNS: 'translations',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

i18n.on('languageChanged', function (lng: string) {
  addResourceBundle(lng);
});

export const changeLanguage = (locale: string) => {
  i18n.changeLanguage(locale);
  document.documentElement.lang = locale;
};

export default i18n;
