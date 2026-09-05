"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  getSavedLanguage,
  type Language
} from "./index";

function subscribe(cb: () => void) {
  i18n.on("languageChanged", cb);
  return () => i18n.off("languageChanged", cb);
}

function getSnapshot() {
  return i18n.language;
}

function getServerSnapshot() {
  return DEFAULT_LANGUAGE;
}

export function useLanguage() {
  const language = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLanguage = useCallback((lng: Language) => {
    i18n.changeLanguage(lng);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
    } catch {}
  }, []);

  return { language, setLanguage };
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Apply the persisted language after hydration to avoid SSR/CSR mismatches.
  useEffect(() => {
    const saved = getSavedLanguage();
    if (saved !== i18n.language) i18n.changeLanguage(saved);
  }, []);

  // Keep <html lang> in sync with the active language.
  useEffect(() => {
    const sync = (lng: string) => {
      document.documentElement.lang = lng;
    };
    sync(i18n.language);
    i18n.on("languageChanged", sync);
    return () => i18n.off("languageChanged", sync);
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
