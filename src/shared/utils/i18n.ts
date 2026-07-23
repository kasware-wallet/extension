/**
 * Shared i18n utilities for both UI and background bundles.
 *
 * NOTE: Some files import { t } from 'i18next' directly instead of using
 * the project's i18n wrappers. This works because i18next is a singleton,
 * but the wrapper modules handle initialization and bundle loading.
 * Prefer importing from the project's i18n modules when possible.
 */

export const I18N_NS = 'translations';

/**
 * Creates an addResourceBundle function bound to the given i18n instance.
 * Used by both background and UI i18n modules to avoid duplication.
 */
export const createAddResourceBundle = (i18nInstance: {
  hasResourceBundle: (lng: string, ns: string) => boolean;
  addResourceBundle: (lng: string, ns: string, bundle: Record<string, string>) => void;
}) => {
  return async (locale: string) => {
    if (i18nInstance.hasResourceBundle(locale, I18N_NS)) return;
    const bundle = await fetchLocale(locale);
    if (Object.keys(bundle).length === 0) return;
    i18nInstance.addResourceBundle(locale, I18N_NS, bundle);
  };
};

/**
 * Fetches a locale file and transforms keys from Chrome extension format
 * (__ as word separator) to i18next format (space as separator).
 *
 * @param locale - Locale code matching a _locales/ directory (e.g. 'en', 'zh_CN')
 * @returns Object mapping translation keys to translated messages, or empty object on failure
 */
export const fetchLocale = async (locale: string): Promise<Record<string, string>> => {
  try {
    const res = await fetch(`./_locales/${locale}/messages.json`);
    const data: Record<string, { message: string; description: string }> = await res.json();
    return Object.keys(data).reduce((acc, key) => {
      acc[key.replace(/__/g, ' ')] = data[key].message;
      return acc;
    }, {} as Record<string, string>);
  } catch (e) {
    console.warn(`Failed to load locale '${locale}':`, e);
    return {};
  }
};
