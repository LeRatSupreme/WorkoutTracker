import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ScrollView,
  Animated,
  PanResponder,
} from "react-native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  createSession,
  getAllCustomTypes,
  createCustomType,
  deleteCustomType,
} from "@/db";
import { Container } from "@/components/ui/Container";
import { useSessionStore } from "@/store/session-store";
import type { WorkoutType, CustomWorkoutType } from "@/types";

const FIXED_TYPES: {
  type: WorkoutType;
  label: string;
  emoji: string;
  description: string;
}[] = [
  {
    type: "push",
    label: "Push",
    emoji: "💪",
    description: "Pectoraux, épaules, triceps",
  },
  {
    type: "pull",
    label: "Pull",
    emoji: "🏋️",
    description: "Dos, biceps, avant-bras",
  },
  {
    type: "legs",
    label: "Legs",
    emoji: "🦵",
    description: "Quadriceps, ischio-jambiers, mollets",
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
    <View className="relative overflow-hidden rounded-2xl">
      <View className="absolute right-0 top-0 bottom-0 w-20 bg-destructive justify-center items-center rounded-r-2xl">
        <Pressable onPress={handleDeletePress} className="p-3">
          <Text className="text-white font-semibold text-sm">Suppr.</Text>
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
  const startSession = useSessionStore((s) => s.startSession);
  const [customTypes, setCustomTypes] = useState<CustomWorkoutType[]>([]);

  useEffect(() => {
    getAllCustomTypes(db).then(setCustomTypes);
  }, [db]);

  const handleSelectFixed = async (type: WorkoutType) => {
    const session = await createSession(db, type);
    startSession(session.id, type, session.started_at);
    router.replace("/session/active");
  };

  const handleSelectCustom = async (customType: CustomWorkoutType) => {
    const session = await createSession(db, "custom", customType.name);
    startSession(session.id, "custom", session.started_at, customType.name);
    router.replace("/session/active");
  };

  const handleCreateCustom = () => {
    Alert.prompt(
      "Nouveau type de séance",
      "Donne un nom à ta séance",
      async (name) => {
        const trimmed = name?.trim();
        if (!trimmed) return;
        const created = await createCustomType(db, trimmed);
        setCustomTypes((prev) => [...prev, created]);
      },
      "plain-text",
      "",
      "default"
    );
  };

  const handleDeleteCustom = (customType: CustomWorkoutType) => {
    Alert.alert(
      "Supprimer ce type ?",
      `"${customType.name}" sera supprimé définitivement.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
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
      <ScrollView className="flex-1 px-6 pt-8">
        <Pressable onPress={() => router.back()} className="mb-6">
          <Text className="text-accent text-base">← Retour</Text>
        </Pressable>

        <Text className="text-2xl font-bold text-textPrimary mb-1">
          Quel type de séance ?
        </Text>
        <Text className="text-base text-textSecondary mb-8">
          Choisis ton programme
        </Text>

        <View className="gap-3">
          {FIXED_TYPES.map(({ type, label, emoji, description }) => (
            <Pressable
              key={type}
              onPress={() => handleSelectFixed(type)}
              className="bg-card rounded-2xl p-5 border border-cardBorder active:opacity-80 flex-row items-center"
            >
              <Text className="text-2xl mr-4">{emoji}</Text>
              <View>
                <Text className="text-lg font-semibold text-textPrimary">
                  {label}
                </Text>
                <Text className="text-sm text-textSecondary">{description}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {customTypes.length > 0 && (
          <View className="mt-8">
            <Text className="text-lg font-semibold text-textPrimary mb-3">
              Mes séances
            </Text>
            <View className="gap-3">
              {customTypes.map((ct) => (
                <SwipeableCard
                  key={ct.id}
                  onDelete={() => handleDeleteCustom(ct)}
                >
                  <Pressable
                    onPress={() => handleSelectCustom(ct)}
                    onLongPress={() => handleDeleteCustom(ct)}
                    className="bg-card rounded-2xl p-5 border border-cardBorder active:opacity-80 flex-row items-center"
                  >
                    <Text className="text-2xl mr-4">🏷️</Text>
                    <Text className="text-lg font-semibold text-textPrimary">
                      {ct.name}
                    </Text>
                  </Pressable>
                </SwipeableCard>
              ))}
            </View>
          </View>
        )}

        <Pressable
          onPress={handleCreateCustom}
          className="mt-6 mb-8 bg-card rounded-2xl p-5 border border-dashed border-textTertiary active:opacity-80 items-center"
        >
          <Text className="text-base font-medium text-accent">
            + Créer un type
          </Text>
        </Pressable>
      </ScrollView>
    </Container>
  );
}
