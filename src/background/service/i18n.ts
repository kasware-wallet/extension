import i18n from 'i18next';
import browser from '../../shared/webapi/browser';
import { LANGS } from '@/shared/constant/i18n';
import log from 'loglevel';
import { I18N_NS, createAddResourceBundle } from '@/shared/utils/i18n';

export { I18N_NS };

export const addResourceBundle = createAddResourceBundle(i18n);

i18n.init({
  fallbackLng: 'en',
  defaultNS: 'translations',
  interpolation: {
    escapeValue: false // react already safes from xss
  }
});

i18n.on('languageChanged', function (lng: string) {
  addResourceBundle(lng);
});

export default i18n;

export const getFirstPreferredLangCode = async (): Promise<string> => {
  let userPreferredLocaleCodes: string[];

  try {
    userPreferredLocaleCodes = await browser.i18n.getAcceptLanguages();
    log.debug('userPreferredLocaleCodes', userPreferredLocaleCodes);
  } catch (e) {
    userPreferredLocaleCodes = [];
  }
  const firstPreferredLangCode = LANGS.find((item) => {
    return userPreferredLocaleCodes.find(
      (code) =>
        code.toLowerCase() === item.code.toLowerCase() ||
        item.code.toLowerCase() === code.toLowerCase().split(/[-_]/)[0]
    );
  })?.code;
  return firstPreferredLangCode || 'en';
};
