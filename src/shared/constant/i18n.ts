/**
 * Canonical i18n language definitions.
 * Single source of truth for supported locales across Kaspa and EVM chains.
 * When adding a new language, add a _locales/<code>/messages.json file
 * and add an entry here.
 */

export interface LangDef {
  /** Locale code matching _locales/ directory name (e.g. 'en', 'zh_CN') */
  code: string;
  /** Display name in the locale's own language (e.g. 'English', '简体中文') */
  name: string;
}

export const LANGS: LangDef[] = [
  { code: 'en', name: 'English' },
  { code: 'zh_CN', name: '简体中文' },
  { code: 'zh_TW', name: '繁體中文（台湾）' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'ru', name: 'Русский' },
  { code: 'id', name: 'Bahasa Indonesia' }
];

/** Plain array of supported locale codes, used for validation */
export const SUPPORT_LOCALES: string[] = LANGS.map((lang) => lang.code);
