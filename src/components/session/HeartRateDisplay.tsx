import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import type { HRZoneInfo } from "@/lib/health";

interface HeartRateDisplayProps {
  currentBPM: number | null;
  avgBPM: number | null;
  maxBPM: number | null;
  zone: HRZoneInfo | null;
  isMonitoring: boolean;
}

export function HeartRateDisplay({
  currentBPM,
  avgBPM,
  maxBPM,
  zone,
  isMonitoring,
}: HeartRateDisplayProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const heartScale = useSharedValue(1);

  // Pulse animation when we have a BPM
  useEffect(() => {
    if (currentBPM && currentBPM > 0) {
      // Pulse frequency matches heart rate (roughly)
      const duration = Math.max(300, Math.min(1000, 60000 / currentBPM));
      heartScale.value = withRepeat(
        withTiming(1.2, { duration: duration / 2 }),
        -1,
        true
      );
    } else {
      heartScale.value = 1;
    }
  }, [currentBPM, heartScale]);

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  if (!isMonitoring) return null;

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      {/* Main BPM */}
      <View style={styles.mainRow}>
        <Animated.Text style={[styles.heartIcon, heartAnimatedStyle]}>
          ❤️
        </Animated.Text>
        <Text
          style={[
            styles.bpmValue,
            { color: zone?.color ?? colors.textPrimary },
          ]}
        >
          {currentBPM ?? "--"}
        </Text>
        <Text style={[styles.bpmUnit, { color: colors.textTertiary }]}>
          BPM
        </Text>
      </View>

      {/* Zone indicator */}
      {zone && (
        <View style={[styles.zoneBadge, { backgroundColor: zone.color + "20" }]}>
          <View style={[styles.zoneDot, { backgroundColor: zone.color }]} />
          <Text style={[styles.zoneText, { color: zone.color }]}>
            {t(`health.zones.${zone.zone}`)}
          </Text>
        </View>
      )}

      {/* Avg / Max row */}
      {(avgBPM || maxBPM) && (
        <View style={styles.statsRow}>
          {avgBPM && (
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
                {t("health.avgHR")}
              </Text>
              <Text style={[styles.statValue, { color: colors.textSecondary }]}>
                {avgBPM}
              </Text>
            </View>
          )}
          {maxBPM && (
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
                {t("health.maxHR")}
              </Text>
              <Text style={[styles.statValue, { color: colors.textSecondary }]}>
                {maxBPM}
              </Text>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 8,
    gap: 6,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  heartIcon: {
    fontSize: 18,
    marginRight: 2,
  },
  bpmValue: {
    fontSize: 28,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  bpmUnit: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 2,
  },
  zoneBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  zoneDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  zoneText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 2,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});
