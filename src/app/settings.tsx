import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  StyleSheet,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system/next";
import { useSQLiteContext } from "expo-sqlite";
import { useTranslation } from "react-i18next";
import { usePreferences } from "@/hooks/usePreferences";
import { useTheme } from "@/hooks/useTheme";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { ACCENT_PRESETS, AccentKey } from "@/lib/constants";
import { exportDatabase, importDatabase } from "@/lib/export-import";

const ACCENT_KEYS = Object.keys(ACCENT_PRESETS) as AccentKey[];



interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
  trailing?: React.ReactNode;
}

function SettingsRow({
  icon,
  iconColor,
  label,
  subtitle,
  onPress,
  disabled,
  trailing,
}: SettingsRowProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="flex-row items-center py-3.5 active:opacity-70"
    >
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: (iconColor || colors.accent) + "15" },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={iconColor || colors.accent}
        />
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-base text-textPrimary">{label}</Text>
        {subtitle && (
          <Text className="text-xs text-textTertiary mt-0.5">
            {subtitle}
          </Text>
        )}
      </View>
      {trailing || (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.textTertiary}
        />
      )}
    </Pressable>
  );
}

function SectionHeader({ title, delay = 0 }: { title: string; delay?: number }) {
  return (
    <Animated.View entering={FadeInDown.duration(400).delay(delay)}>
      <Text className="text-xs font-bold text-textTertiary tracking-widest uppercase mb-2 mt-6 ml-1">
        {title}
      </Text>
    </Animated.View>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const db = useSQLiteContext();
  const { firstName, setFirstName, accentKey, setAccentKey, language, setLanguage: setAppLanguage } =
    usePreferences();
  const { colors, isDark } = useTheme();
  const [name, setName] = useState("");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    setName(firstName);
  }, [firstName]);

  const handleSave = async () => {
    await setFirstName(name.trim());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const handleAccentChange = (key: AccentKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAccentKey(key);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const json = await exportDatabase(db);

      const fileName = `workout-tracker-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      const file = new File(Paths.cache, fileName);
      file.write(json);

      await Sharing.shareAsync(file.uri, {
        mimeType: "application/json",
        dialogTitle: fileName,
      });
    } catch (error) {
      if ((error as Error).message?.includes("cancel")) return;
      Alert.alert(t("settings.error"), t("settings.exportError"));
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const importedFile = new File(file.uri);
      const json = await importedFile.text();

      try {
        JSON.parse(json);
      } catch {
        Alert.alert(t("settings.error"), t("settings.invalidJSON"));
        return;
      }

      Alert.alert(
        t("settings.importTitle"),
        t("settings.importMessage"),
        [
          {
            text: t("settings.merge"),
            onPress: () => doImport(json, "merge"),
          },
          {
            text: t("settings.replaceAll"),
            style: "destructive",
            onPress: () => {
              Alert.alert(
                t("settings.confirmReplace"),
                t("settings.confirmReplaceMessage"),
                [
                  { text: t("settings.cancel"), style: "cancel" },
                  {
                    text: t("settings.replace"),
                    style: "destructive",
                    onPress: () => doImport(json, "replace"),
                  },
                ]
              );
            },
          },
          { text: t("settings.cancel"), style: "cancel" },
        ]
      );
    } catch (error) {
      Alert.alert(t("settings.error"), t("settings.cannotReadFile"));
    }
  };

  const doImport = async (json: string, mode: "merge" | "replace") => {
    try {
      setImporting(true);
      const stats = await importDatabase(db, json, mode);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const message =
        mode === "merge"
          ? t("settings.importMergeResult", { sessions: stats.sessionsCount, exercises: stats.exercisesCount })
          : t("settings.importReplaceResult", { sessions: stats.sessionsCount, exercises: stats.exercisesCount });

      Alert.alert(t("settings.importComplete"), message, [
        { text: t("settings.ok"), onPress: () => router.replace("/") },
      ]);
    } catch (error) {
      Alert.alert(t("settings.importError"), (error as Error).message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Container>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-2 pb-12">
          {/* ─── Header ─── */}
          <Animated.View
            entering={FadeInDown.duration(400)}
            className="flex-row items-center justify-between mb-2"
          >
            <Pressable
              onPress={() => router.back()}
              className="flex-row items-center py-2"
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color={colors.accent}
              />
              <Text
                className="text-base ml-0.5"
                style={{ color: colors.accent }}
              >
                {t("settings.back")}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              className="py-2 px-4 rounded-full"
              style={{ backgroundColor: colors.accent + "15" }}
            >
              <Text
                className="text-sm font-bold"
                style={{ color: colors.accent }}
              >
                {t("settings.save")}
              </Text>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(50)}>
            <Text className="text-3xl font-bold text-textPrimary mb-1">
              {t("settings.title")}
            </Text>
            <Text className="text-sm text-textSecondary">
              {t("settings.subtitle")}
            </Text>
          </Animated.View>

          {/* ─── Profil ─── */}
          <SectionHeader title={t("settings.profile")} delay={100} />
          <Animated.View entering={FadeInDown.duration(400).delay(150)}>
            <Card variant="elevated">
              <Text className="text-xs font-semibold text-textTertiary tracking-wide uppercase mb-2">
                {t("settings.firstName")}
              </Text>
              <View className="flex-row items-center">
                <View
                  style={[
                    styles.rowIcon,
                    { backgroundColor: colors.accent + "15" },
                  ]}
                >
                  <Ionicons
                    name="person"
                    size={18}
                    color={colors.accent}
                  />
                </View>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={t("settings.firstNamePlaceholder")}
                  className="flex-1 ml-3 text-base text-textPrimary bg-fill rounded-xl px-4 h-input"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </Card>
          </Animated.View>

          {/* ─── Apparence ─── */}
          <SectionHeader title={t("settings.appearance")} delay={200} />
          <Animated.View entering={FadeInDown.duration(400).delay(250)}>
            <Card variant="elevated">
              <Text className="text-xs font-semibold text-textTertiary tracking-wide uppercase mb-4">
                {t("settings.accentColor")}
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {ACCENT_KEYS.map((key) => {
                  const color =
                    ACCENT_PRESETS[key][isDark ? "dark" : "light"];
                  const isActive = key === accentKey;

                  return (
                    <Pressable
                      key={key}
                      onPress={() => handleAccentChange(key)}
                      className="items-center"
                    >
                      <View
                        style={[
                          styles.colorSwatch,
                          {
                            backgroundColor: color,
                            ...(isActive
                              ? {
                                shadowColor: color,
                                shadowOpacity: 0.5,
                                shadowRadius: 8,
                                shadowOffset: { width: 0, height: 2 },
                                elevation: 6,
                              }
                              : {}),
                          },
                        ]}
                      >
                        {isActive && (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color="#fff"
                          />
                        )}
                      </View>
                      <Text
                        className="text-xs mt-1.5"
                        style={{
                          color: isActive
                            ? colors.textPrimary
                            : colors.textTertiary,
                          fontWeight: isActive ? "600" : "400",
                        }}
                      >
                        {t(`settings.accentColors.${key}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          </Animated.View>

          {/* ─── Language ─── */}
          <SectionHeader title={t("settings.language")} delay={275} />
          <Animated.View entering={FadeInDown.duration(400).delay(300)}>
            <Card variant="elevated">
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setAppLanguage("fr")}
                  className="flex-1 items-center py-3 rounded-xl"
                  style={{
                    backgroundColor: language === "fr" ? colors.accent + "20" : colors.fill,
                    borderWidth: language === "fr" ? 1.5 : 0,
                    borderColor: language === "fr" ? colors.accent : "transparent",
                  }}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: language === "fr" ? colors.accent : colors.textSecondary }}
                  >
                    {t("settings.languageFrench")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setAppLanguage("en")}
                  className="flex-1 items-center py-3 rounded-xl"
                  style={{
                    backgroundColor: language === "en" ? colors.accent + "20" : colors.fill,
                    borderWidth: language === "en" ? 1.5 : 0,
                    borderColor: language === "en" ? colors.accent : "transparent",
                  }}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: language === "en" ? colors.accent : colors.textSecondary }}
                  >
                    {t("settings.languageEnglish")}
                  </Text>
                </Pressable>
              </View>
            </Card>
          </Animated.View>

          {/* ─── Données ─── */}
          <SectionHeader title={t("settings.data")} delay={350} />
          <Animated.View entering={FadeInDown.duration(400).delay(400)}>
            <Card variant="elevated">
              <SettingsRow
                icon="cloud-upload-outline"
                label={
                  exporting ? t("settings.exporting") : t("settings.exportData")
                }
                subtitle={t("settings.exportSubtitle")}
                onPress={handleExport}
                disabled={exporting}
              />
              <View
                className="h-px mx-1"
                style={{ backgroundColor: colors.separator }}
              />
              <SettingsRow
                icon="cloud-download-outline"
                label={
                  importing ? t("settings.importing") : t("settings.importData")
                }
                subtitle={t("settings.importSubtitle")}
                onPress={handleImport}
                disabled={importing}
              />
            </Card>
          </Animated.View>

          {/* ─── À propos ─── */}
          <SectionHeader title={t("settings.about")} delay={450} />
          <Animated.View entering={FadeInDown.duration(400).delay(500)}>
            <Card>
              <View className="items-center py-2">
                <Text className="text-sm text-textTertiary">
                  {t("settings.aboutVersion")}
                </Text>
                <Text className="text-xs text-textTertiary mt-1">
                  {t("settings.aboutMadeWith")}
                </Text>
              </View>
            </Card>
          </Animated.View>
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
