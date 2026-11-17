"use client";

import { useSettingsStore } from "@/store/settings";
import type { TranslationDictionary } from "./types";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { fr } from "./locales/fr";
import { ja } from "./locales/ja";

export * from "./types";

export const LOCALES: Record<string, { name: string; nativeName: string; dict: TranslationDictionary }> = {
  en: { name: "English", nativeName: "English", dict: en },
  es: { name: "Spanish", nativeName: "Español", dict: es },
  fr: { name: "French", nativeName: "Français", dict: fr },
  ja: { name: "Japanese", nativeName: "日本語", dict: ja },
};

export type SupportedLocale = keyof typeof LOCALES;

export function getDictionary(locale: string): TranslationDictionary {
  return LOCALES[locale]?.dict || en;
}

/**
 * Universal translation hook connected to user settings store
 */
export function useTranslation() {
  const locale = useSettingsStore((s) => s.locale) || "en";
  const setLocale = useSettingsStore((s) => s.setLocale);

  const dict = getDictionary(locale);

  /**
   * Helper to fetch nested translation or fallback to English
   */
  const t = <Section extends keyof TranslationDictionary, Key extends keyof TranslationDictionary[Section]>(
    section: Section,
    key: Key
  ): string => {
    const sectionObj = dict[section];
    if (sectionObj && (sectionObj as any)[key]) {
      return (sectionObj as any)[key];
    }
    return (en[section] as any)?.[key] || `${String(section)}.${String(key)}`;
  };

  return {
    locale,
    setLocale,
    t,
    dict,
    supportedLocales: Object.entries(LOCALES).map(([code, meta]) => ({
      code,
      name: meta.name,
      nativeName: meta.nativeName,
    })),
  };
}
