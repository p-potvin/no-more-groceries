/**
 * React hook — useLocale
 * Provides reactive locale switching to any component.
 *
 * import { useLocale } from '../../packages/shared/i18n/use-locale.js';
 * const { locale, setLocale, t } = useLocale();
 */

import { useState, useCallback, createContext, useContext } from 'react';
import { setLocale as coreSetLocale, getLocale, t as coreT } from './index.js';

// ── Context (wrap your app root in <LocaleProvider>) ───────────────────────
export const LocaleContext = createContext(null);

export function LocaleProvider({ children }) {
  const [locale, _set] = useState(getLocale);

  const setLocale = useCallback((loc) => {
    coreSetLocale(loc);
    _set(loc);
  }, []);

  const t = useCallback((key, vars) => coreT(key, vars), [locale]); // eslint-disable-line

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

/** Use inside any component wrapped by <LocaleProvider> */
export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used inside <LocaleProvider>');
  return ctx;
}
