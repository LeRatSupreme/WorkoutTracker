import { View, Text, Modal, Pressable, StyleSheet, Platform } from "react-native";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { useRestTimer } from "@/hooks/useRestTimer";
import { formatTimer } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

const glassAvailable = isLiquidGlassAvailable();

const DURATIONS = [
  { label: "1:00", seconds: 60 },
  { label: "1:30", seconds: 90 },
  { label: "2:00", seconds: 120 },
  { label: "3:00", seconds: 180 },
];

interface RestTimerModalProps {
  visible: boolean;
  onClose: () => void;
}

const timerStyles = StyleSheet.create({
  digits: {
    fontVariant: ["tabular-nums"],
    letterSpacing: 2,
    ...(Platform.OS === "ios" ? { fontFamily: "System" } : {}),
  },
});

const glassStyles = StyleSheet.create({
  modal: {
    overflow: "hidden" as const,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
});

export function RestTimerModal({ visible, onClose }: RestTimerModalProps) {
  const { seconds, isRunning, start, skip } = useRestTimer();

  const handleClose = () => {
    skip();
    onClose();
  };

  const content = (
    <>
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-xl font-bold text-textPrimary">
          Timer de repos
        </Text>
        <Pressable onPress={handleClose}>
          <Text className="text-accent text-base">Fermer</Text>
        </Pressable>
      </View>

      {isRunning ? (
        <View className="items-center py-8">
          <Text
            className="text-6xl font-light text-textPrimary mb-8"
            style={timerStyles.digits}
          >
            {formatTimer(seconds)}
          </Text>
          <Button title="Passer" variant="secondary" onPress={handleClose} />
        </View>
      ) : (
        <View>
          <Text className="text-base text-textSecondary mb-4">
            Choisis la durée
          </Text>
          <View className="flex-row gap-3">
            {DURATIONS.map(({ label, seconds: dur }) => (
              <Pressable
                key={dur}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  start(dur);
                }}
                className="flex-1 bg-fill rounded-xl py-4 items-center active:opacity-80"
              >
                <Text className="text-lg font-semibold text-textPrimary">
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end">
        {glassAvailable ? (
          <GlassView
            glassEffectStyle="regular"
            style={glassStyles.modal}
          >
            {content}
          </GlassView>
        ) : (
          <View className="bg-card rounded-t-3xl px-6 pt-6 pb-10 shadow-lg">
            {content}
          </View>
        )}
      </View>
    </Modal>
  );
}
