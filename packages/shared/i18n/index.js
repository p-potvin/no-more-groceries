/**
 * i18n — Internationalization module
 * Supports: en (English), fr-CA (French — Québec)
 *
 * Usage:
 *   import { t, setLocale, getLocale } from './packages/shared/i18n/index.js';
 *   t('deals.title')          // → "Best Deals Today" or "Meilleures offres du jour"
 *   setLocale('fr-CA');
 */

import { en } from './locales/en.js';
import { frCA } from './locales/fr-CA.js';

const LOCALES = { en, 'fr-CA': frCA };
const SUPPORTED = Object.keys(LOCALES);

let _current = 'fr-CA';

/** Set the active locale. Throws for unsupported locales. */
export function setLocale(locale) {
  if (!LOCALES[locale]) throw new Error(`Unsupported locale "${locale}". Supported: ${SUPPORTED.join(', ')}`);
  _current = locale;
}

/** Get the current locale key. */
export function getLocale() { return _current; }

/** List all supported locale keys. */
export function getSupportedLocales() { return SUPPORTED; }

/**
 * Translate a dot-separated key, with optional interpolation values.
 *
 * @param {string} key   - e.g. "deals.title"
 * @param {Record<string,string|number>} [vars] - e.g. { count: 5 }
 * @returns {string}
 *
 * @example
 *   t('cart.householdSize', { n: 4 }) → "4 personnes" (fr-CA)
 */
export function t(key, vars = {}) {
  const parts  = key.split('.');
  let   node   = LOCALES[_current];

  for (const p of parts) {
    if (node == null || typeof node !== 'object') break;
    node = node[p];
  }

  // Fall back to English if the key is missing in the current locale
  if (node == null || typeof node !== 'string') {
    let fallback = LOCALES['en'];
    for (const p of parts) {
      if (fallback == null || typeof fallback !== 'object') { fallback = null; break; }
      fallback = fallback[p];
    }
    node = fallback;
  }

  if (node == null) return key; // Last resort: return the key itself

  // Interpolate {{varName}} placeholders
  return node.replace(/\{\{(\w+)\}\}/g, (_, name) =>
    vars[name] != null ? String(vars[name]) : `{{${name}}}`
  );
}

/**
 * React hook for locale state (no external deps required).
 * Import directly in React components.
 */
export { useLocale, LocaleProvider, LocaleContext } from './use-locale.jsx';
