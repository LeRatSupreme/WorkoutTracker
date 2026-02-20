import "../../global.css";
import { useEffect } from "react";
import { View, Platform } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { SQLiteProvider } from "expo-sqlite";
import { vars, useColorScheme } from "nativewind";
import * as Notifications from "expo-notifications";
import { migrateDbIfNeeded } from "@/db";
import { PreferencesProvider, usePreferences } from "@/hooks/usePreferences";
import { ACCENT_PRESETS } from "@/lib/constants";

const DB_NAME = "workout-tracker.db";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function AccentWrapper({ children }: { children: React.ReactNode }) {
  const { accentKey } = usePreferences();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const accentColor = ACCENT_PRESETS[accentKey][isDark ? "dark" : "light"];

  return (
    <View style={[{ flex: 1 }, vars({ "--color-accent": accentColor })]}>
      {children}
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === "ios") {
      Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowSound: true },
      });
    }
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <SQLiteProvider databaseName={DB_NAME} onInit={migrateDbIfNeeded}>
        <PreferencesProvider>
          <AccentWrapper>
            <Stack screenOptions={{ headerShown: false }} />
          </AccentWrapper>
        </PreferencesProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
