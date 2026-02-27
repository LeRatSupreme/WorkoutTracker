import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import fr from "./fr.json";
import en from "./en.json";

const LANGUAGE_KEY = "app_language";

const resources = {
  fr: { translation: fr },
  en: { translation: en },
};

/** Resolve saved language or fall back to device locale */
async function getInitialLanguage(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved && (saved === "fr" || saved === "en")) return saved;
  } catch {}
  const deviceLang = Localization.getLocales()?.[0]?.languageCode ?? "fr";
  return deviceLang === "en" ? "en" : "fr"; // default to French for non-EN locales
}

/** Persist language choice */
export async function setLanguage(lang: "fr" | "en") {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  await i18n.changeLanguage(lang);
}

/** Get saved language key */
export async function getLanguage(): Promise<"fr" | "en"> {
  const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (saved === "en") return "en";
  return "fr";
}

/** Initialize i18n — call once before app renders */
export async function initI18n() {
  const lng = await getInitialLanguage();

  await i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: "fr",
    interpolation: { escapeValue: false },
    compatibilityJSON: "v4",
  });
}

export default i18n;
