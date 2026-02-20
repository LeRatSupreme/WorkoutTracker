import { useState, useEffect, useCallback, useContext, createContext, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AccentKey, DEFAULT_ACCENT_KEY, ACCENT_PRESETS } from "@/lib/constants";

const KEY_FIRST_NAME = "user_first_name";
const KEY_ACCENT_COLOR = "accent_color";

interface PreferencesContextValue {
  firstName: string;
  setFirstName: (name: string) => Promise<void>;
  accentKey: AccentKey;
  setAccentKey: (key: AccentKey) => Promise<void>;
  loading: boolean;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [firstName, setFirstNameState] = useState<string>("");
  const [accentKey, setAccentKeyState] = useState<AccentKey>(DEFAULT_ACCENT_KEY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(KEY_FIRST_NAME),
      AsyncStorage.getItem(KEY_ACCENT_COLOR),
    ]).then(([name, accent]) => {
      setFirstNameState(name ?? "");
      if (accent && accent in ACCENT_PRESETS) {
        setAccentKeyState(accent as AccentKey);
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

  return (
    <PreferencesContext.Provider value={{ firstName, setFirstName, accentKey, setAccentKey, loading }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
