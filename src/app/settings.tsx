import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system/next";
import { useSQLiteContext } from "expo-sqlite";
import { usePreferences } from "@/hooks/usePreferences";
import { useTheme } from "@/hooks/useTheme";
import { Container } from "@/components/ui/Container";
import { ACCENT_PRESETS, AccentKey } from "@/lib/constants";
import { exportDatabase, importDatabase } from "@/lib/export-import";

const ACCENT_KEYS = Object.keys(ACCENT_PRESETS) as AccentKey[];

export default function SettingsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { firstName, setFirstName, accentKey, setAccentKey } = usePreferences();
  const { colors, isDark } = useTheme();
  const [name, setName] = useState("");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    setName(firstName);
  }, [firstName]);

  const handleSave = async () => {
    await setFirstName(name.trim());
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

      const fileName = `workout-tracker-${new Date().toISOString().slice(0, 10)}.json`;
      const file = new File(Paths.cache, fileName);
      file.write(json);

      await Sharing.shareAsync(file.uri, {
        mimeType: "application/json",
        dialogTitle: fileName,
      });
    } catch (error) {
      if ((error as Error).message?.includes("cancel")) return;
      Alert.alert("Erreur", "Impossible d'exporter les donnees");
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

      // Valider que c'est du JSON parsable
      try {
        JSON.parse(json);
      } catch {
        Alert.alert("Erreur", "Le fichier n'est pas un JSON valide");
        return;
      }

      Alert.alert(
        "Importer les donnees",
        "Comment voulez-vous importer ?",
        [
          {
            text: "Fusionner",
            onPress: () => doImport(json, "merge"),
          },
          {
            text: "Tout remplacer",
            style: "destructive",
            onPress: () => {
              Alert.alert(
                "Confirmer le remplacement",
                "Toutes vos donnees actuelles seront supprimees et remplacees par le fichier importe.",
                [
                  { text: "Annuler", style: "cancel" },
                  {
                    text: "Remplacer",
                    style: "destructive",
                    onPress: () => doImport(json, "replace"),
                  },
                ]
              );
            },
          },
          { text: "Annuler", style: "cancel" },
        ]
      );
    } catch (error) {
      Alert.alert("Erreur", "Impossible de lire le fichier");
    }
  };

  const doImport = async (json: string, mode: "merge" | "replace") => {
    try {
      setImporting(true);
      const stats = await importDatabase(db, json, mode);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const message =
        mode === "merge"
          ? `${stats.sessionsCount} nouvelle(s) seance(s) et ${stats.exercisesCount} nouvel(s) exercice(s) ajoute(s).`
          : `${stats.sessionsCount} seance(s) et ${stats.exercisesCount} exercice(s) importes.`;

      Alert.alert("Import termine", message, [
        {
          text: "OK",
          onPress: () => router.replace("/"),
        },
      ]);
    } catch (error) {
      Alert.alert("Erreur d'import", (error as Error).message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Container>
      <View className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between mb-8">
          <Pressable onPress={() => router.back()}>
            <Text className="text-accent text-base">{"\u2190"} Retour</Text>
          </Pressable>
          <Pressable onPress={handleSave}>
            <Text className="text-accent text-base font-semibold">
              Enregistrer
            </Text>
          </Pressable>
        </View>

        <Text className="text-2xl font-bold text-textPrimary mb-6">
          Parametres
        </Text>

        <Text className="text-sm text-textSecondary mb-2">Prenom</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ton prenom"
          autoFocus
          className="bg-fill rounded-xl px-4 h-input text-base text-textPrimary"
          placeholderTextColor={colors.textTertiary}
        />

        <Text className="text-sm text-textSecondary mb-3 mt-6">
          Couleur d'accent
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {ACCENT_KEYS.map((key) => {
            const color = ACCENT_PRESETS[key][isDark ? "dark" : "light"];
            const isActive = key === accentKey;
            return (
              <Pressable
                key={key}
                onPress={() => handleAccentChange(key)}
                style={{ backgroundColor: color }}
                className="w-10 h-10 rounded-full items-center justify-center"
              >
                {isActive && (
                  <Text className="text-white text-base font-bold">
                    {"\u2713"}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        <Text className="text-sm text-textSecondary mb-3 mt-8">
          Donnees
        </Text>
        <View className="gap-3">
          <Pressable
            onPress={handleExport}
            disabled={exporting}
            className="bg-fill rounded-xl px-4 py-4 active:opacity-80"
          >
            <Text className="text-textPrimary text-base">
              {exporting ? "Export en cours..." : "Exporter mes donnees"}
            </Text>
            <Text className="text-textTertiary text-xs mt-1">
              Sauvegarde JSON de toutes tes seances
            </Text>
          </Pressable>

          <Pressable
            onPress={handleImport}
            disabled={importing}
            className="bg-fill rounded-xl px-4 py-4 active:opacity-80"
          >
            <Text className="text-textPrimary text-base">
              {importing ? "Import en cours..." : "Importer des donnees"}
            </Text>
            <Text className="text-textTertiary text-xs mt-1">
              Depuis un fichier JSON exporte
            </Text>
          </Pressable>
        </View>
      </View>
    </Container>
  );
}
