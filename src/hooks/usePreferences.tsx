import { useState, useEffect, useCallback, useContext, createContext, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AccentKey, DEFAULT_ACCENT_KEY, ACCENT_PRESETS } from "@/lib/constants";
import { setLanguage as setI18nLanguage } from "@/i18n";

const KEY_FIRST_NAME = "user_first_name";
const KEY_ACCENT_COLOR = "accent_color";
const KEY_LANGUAGE = "app_language";

export type AppLanguage = "fr" | "en";

interface PreferencesContextValue {
  firstName: string;
  setFirstName: (name: string) => Promise<void>;
  accentKey: AccentKey;
  setAccentKey: (key: AccentKey) => Promise<void>;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => Promise<void>;
  loading: boolean;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [firstName, setFirstNameState] = useState<string>("");
  const [accentKey, setAccentKeyState] = useState<AccentKey>(DEFAULT_ACCENT_KEY);
  const [language, setLanguageState] = useState<AppLanguage>("fr");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(KEY_FIRST_NAME),
      AsyncStorage.getItem(KEY_ACCENT_COLOR),
      AsyncStorage.getItem(KEY_LANGUAGE),
    ]).then(([name, accent, lang]) => {
      setFirstNameState(name ?? "");
      if (accent && accent in ACCENT_PRESETS) {
        setAccentKeyState(accent as AccentKey);
      }
      if (lang === "en" || lang === "fr") {
        setLanguageState(lang);
      }
      setLoading(false);
    });
  }, []);

  const setFirstName = useCallback(async (name: string) => {
    await AsyncStorage.setItem(KEY_FIRST_NAME, name);
    setFirstNameState(name);
  }, []);

  const setAccentKey = useCallback(async (key: AccentKey) => {
    await AsyncStorage.setItem(KEY_ACCENT_COLOR, key);
    setAccentKeyState(key);
  }, []);

  const setLanguage = useCallback(async (lang: AppLanguage) => {
    await setI18nLanguage(lang);
    setLanguageState(lang);
  }, []);

  return (
    <PreferencesContext.Provider value={{ firstName, setFirstName, accentKey, setAccentKey, language, setLanguage, loading }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
