import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import enAuth from "./locales/en/auth.json";
import enDashboard from "./locales/en/dashboard.json";
import enGroups from "./locales/en/groups.json";
import enProfile from "./locales/en/profile.json";
import enTrainer from "./locales/en/trainer.json";
import enErrors from "./locales/en/errors.json";

import esCommon from "./locales/es/common.json";
import esAuth from "./locales/es/auth.json";
import esDashboard from "./locales/es/dashboard.json";
import esGroups from "./locales/es/groups.json";
import esProfile from "./locales/es/profile.json";
import esTrainer from "./locales/es/trainer.json";
import esErrors from "./locales/es/errors.json";

export const LANGUAGE_STORAGE_KEY = "gymcrew:language";
export const DEFAULT_LANGUAGE = "en";
export const SUPPORTED_LANGUAGES = ["en", "es"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export function isSupportedLanguage(value: unknown): value is Language {
  return typeof value === "string" && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export function getSavedLanguage(): Language {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isSupportedLanguage(saved) ? saved : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

// Always initialise in the default language so the server render and the first
// client render match. I18nProvider switches to the saved language after mount.
i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: enCommon,
      auth: enAuth,
      dashboard: enDashboard,
      groups: enGroups,
      profile: enProfile,
      trainer: enTrainer,
      errors: enErrors
    },
    es: {
      common: esCommon,
      auth: esAuth,
      dashboard: esDashboard,
      groups: esGroups,
      profile: esProfile,
      trainer: esTrainer,
      errors: esErrors
    }
  },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: "common",
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
