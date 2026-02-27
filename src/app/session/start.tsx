import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ScrollView,
  Animated,
  PanResponder,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import AnimatedRN, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import {
  createSession,
  getAllCustomTypes,
  createCustomType,
  deleteCustomType,
} from "@/db";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useSessionStore } from "@/store/session-store";
import { useTheme } from "@/hooks/useTheme";
import type { WorkoutType, CustomWorkoutType } from "@/types";

const FIXED_TYPES: {
  type: WorkoutType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  descriptionKey: string;
  color: string;
}[] = [
    {
      type: "push",
      label: "Push",
      icon: "fitness",
      descriptionKey: "workoutDescriptions.push",
      color: "#FF6B6B",
    },
    {
      type: "pull",
      label: "Pull",
      icon: "body",
      descriptionKey: "workoutDescriptions.pull",
      color: "#4ECDC4",
    },
    {
      type: "legs",
      label: "Legs",
      icon: "walk",
      descriptionKey: "workoutDescriptions.legs",
      color: "#45B7D1",
    },
  ];

function SwipeableCard({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const DELETE_THRESHOLD = -80;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < DELETE_THRESHOLD) {
          Animated.spring(translateX, {
            toValue: DELETE_THRESHOLD,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleDeletePress = () => {
    Animated.timing(translateX, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    onDelete();
  };

  return (
    <View className="relative overflow-hidden rounded-2.5xl">
      <View className="absolute right-0 top-0 bottom-0 w-20 bg-destructive justify-center items-center rounded-r-2.5xl">
        <Pressable onPress={handleDeletePress} className="p-3">
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </Pressable>
      </View>
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

export default function StartSessionScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const startSession = useSessionStore((s) => s.startSession);
  const [customTypes, setCustomTypes] = useState<CustomWorkoutType[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");

  useEffect(() => {
    getAllCustomTypes(db).then(setCustomTypes);
  }, [db]);

  const handleSelectFixed = async (type: WorkoutType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const session = await createSession(db, type);
    startSession(session.id, type, session.started_at);
    router.replace("/session/active");
  };

  const handleSelectCustom = async (customType: CustomWorkoutType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const session = await createSession(db, "custom", customType.name);
    startSession(session.id, "custom", session.started_at, customType.name);
    router.replace("/session/active");
  };

  const handleCreateCustom = async () => {
    const trimmed = newTypeName.trim();
    if (!trimmed) return;
    const created = await createCustomType(db, trimmed);
    setCustomTypes((prev) => [...prev, created]);
    setNewTypeName("");
    setShowCreateModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeleteCustom = (customType: CustomWorkoutType) => {
    Alert.alert(
      t("session.deleteTypeTitle"),
      t("session.deleteTypeMessage", { name: customType.name }),
      [
        { text: t("session.cancel"), style: "cancel" },
        {
          text: t("session.delete"),
          style: "destructive",
          onPress: async () => {
            await deleteCustomType(db, customType.id);
            setCustomTypes((prev) =>
              prev.filter((t) => t.id !== customType.id)
            );
          },
        },
      ]
    );
  };

  return (
    <Container>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}
      >
        {/* ─── Header ─── */}
        <AnimatedRN.View entering={FadeInDown.duration(400)}>
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center py-2 mb-4"
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
              {t("session.back")}
            </Text>
          </Pressable>

          <Text className="text-3xl font-bold text-textPrimary mb-1">
            {t("session.new")}
          </Text>
          <Text className="text-sm text-textSecondary mb-6">
            {t("session.chooseProgram")}
          </Text>
        </AnimatedRN.View>

        {/* ─── Fixed Types ─── */}
        <AnimatedRN.View entering={FadeInDown.duration(400).delay(50)}>
          <Text className="text-xs font-bold text-textTertiary tracking-widest uppercase mb-3">
            {t("session.programs")}
          </Text>
        </AnimatedRN.View>

        <View className="gap-3 mb-6">
          {FIXED_TYPES.map(({ type, label, icon, descriptionKey, color }, i) => (
            <AnimatedRN.View
              key={type}
              entering={FadeInDown.duration(400).delay(100 + i * 60)}
            >
              <Pressable
                onPress={() => handleSelectFixed(type)}
                className="active:opacity-80"
              >
                <Card variant="elevated">
                  <View className="flex-row items-center">
                    <View
                      style={[
                        styles.typeIcon,
                        { backgroundColor: color + "18" },
                      ]}
                    >
                      <Ionicons name={icon} size={22} color={color} />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-lg font-bold text-textPrimary">
                        {label}
                      </Text>
                      <Text className="text-sm text-textSecondary mt-0.5">
                        {t(descriptionKey)}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.textTertiary}
                    />
                  </View>
                </Card>
              </Pressable>
            </AnimatedRN.View>
          ))}
        </View>

        {/* ─── Custom Types ─── */}
        {customTypes.length > 0 && (
          <>
            <AnimatedRN.View entering={FadeInDown.duration(400).delay(300)}>
              <Text className="text-xs font-bold text-textTertiary tracking-widest uppercase mb-3">
                {t("session.myWorkouts")}
              </Text>
            </AnimatedRN.View>
            <View className="gap-3 mb-6">
              {customTypes.map((ct, i) => (
                <AnimatedRN.View
                  key={ct.id}
                  entering={FadeInDown.duration(400).delay(350 + i * 50)}
                >
                  <SwipeableCard onDelete={() => handleDeleteCustom(ct)}>
                    <Pressable
                      onPress={() => handleSelectCustom(ct)}
                      onLongPress={() => handleDeleteCustom(ct)}
                      className="active:opacity-80"
                    >
                      <Card variant="elevated">
                        <View className="flex-row items-center">
                          <View
                            style={[
                              styles.typeIcon,
                              { backgroundColor: colors.accent + "12" },
                            ]}
                          >
                            <Ionicons
                              name="bookmark"
                              size={20}
                              color={colors.accent}
                            />
                          </View>
                          <Text className="text-base font-bold text-textPrimary flex-1 ml-3">
                            {ct.name}
                          </Text>
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={colors.textTertiary}
                          />
                        </View>
                      </Card>
                    </Pressable>
                  </SwipeableCard>
                </AnimatedRN.View>
              ))}
            </View>
          </>
        )}

        {/* ─── Create Custom ─── */}
        <AnimatedRN.View
          entering={FadeInDown.duration(400).delay(
            400 + customTypes.length * 50
          )}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCreateModal(true);
            }}
            className="active:opacity-80"
          >
            <View
              style={[styles.createCard, { borderColor: colors.accent + "40" }]}
              className="rounded-2.5xl p-5 items-center flex-row justify-center"
            >
              <Ionicons
                name="add-circle"
                size={22}
                color={colors.accent}
              />
              <Text
                className="text-base font-bold ml-2"
                style={{ color: colors.accent }}
              >
                {t("session.createType")}
              </Text>
            </View>
          </Pressable>
        </AnimatedRN.View>
      </ScrollView>

      {/* ─── Create Custom Type Modal (cross-platform) ─── */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <Pressable
            onPress={() => setShowCreateModal(false)}
            className="flex-1 justify-center items-center px-8"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              className="w-full rounded-2.5xl p-6"
              style={{ backgroundColor: colors.card }}
            >
              <Text className="text-xl font-bold text-textPrimary mb-1">
                {t("session.newTypeTitle")}
              </Text>
              <Text className="text-sm text-textSecondary mb-5">
                {t("session.newTypeSubtitle")}
              </Text>
              <TextInput
                value={newTypeName}
                onChangeText={setNewTypeName}
                placeholder={t("session.newTypePlaceholder")}
                placeholderTextColor={colors.textTertiary}
                autoFocus
                className="bg-fill rounded-xl px-4 h-input text-base text-textPrimary mb-5"
                style={{ color: colors.textPrimary }}
              />
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => {
                    setNewTypeName("");
                    setShowCreateModal(false);
                  }}
                  className="flex-1 py-3.5 rounded-xl items-center justify-center bg-fill active:opacity-80"
                >
                  <Text className="text-base font-semibold text-textSecondary">
                    {t("session.cancel")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleCreateCustom}
                  disabled={!newTypeName.trim()}
                  className="flex-1 py-3.5 rounded-xl items-center justify-center active:opacity-80"
                  style={{
                    backgroundColor: newTypeName.trim()
                      ? colors.accent
                      : colors.fill,
                  }}
                >
                  <Text
                    className="text-base font-bold"
                    style={{
                      color: newTypeName.trim() ? "#fff" : colors.textTertiary,
                    }}
                  >
                    {t("session.create")}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </Container>
  );
}

const styles = StyleSheet.create({
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  createCard: {
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
});
