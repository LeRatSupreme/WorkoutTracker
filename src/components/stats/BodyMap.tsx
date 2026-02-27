import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, G } from "react-native-svg";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSQLiteContext } from "expo-sqlite";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import { getMuscleVolumeThisWeek, type MuscleVolumeData } from "@/db/queries/stats";
import type { MuscleGroup } from "@/types";

// Color gradient: rest → fatigued
// green = fresh (no work), yellow = moderate, red = heavily worked
function getMuscleFillColor(
  volume: number,
  maxVolume: number,
  isDark: boolean
): string {
  if (volume === 0) return isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  const ratio = Math.min(volume / Math.max(maxVolume, 1), 1);

  if (ratio < 0.3) return "#30D158"; // green — fresh
  if (ratio < 0.5) return "#40C463"; // lighter green
  if (ratio < 0.7) return "#FFD60A"; // yellow — moderate
  if (ratio < 0.85) return "#FF9F0A"; // orange — fatigued
  return "#FF453A"; // red — very fatigued
}

// Simplified front muscle paths (viewBox 0 0 200 400)
const MUSCLE_PATHS: Record<MuscleGroup, { paths: string[]; labelPos: { x: number; y: number } }> = {
  pecs: {
    paths: [
      // Left pec
      "M75,95 C75,85 88,78 100,82 L100,105 C90,108 78,106 75,95Z",
      // Right pec
      "M125,95 C125,85 112,78 100,82 L100,105 C110,108 122,106 125,95Z",
    ],
    labelPos: { x: 100, y: 97 },
  },
  epaules: {
    paths: [
      // Left shoulder
      "M65,75 C58,72 55,80 58,90 L75,88 C75,80 72,74 65,75Z",
      // Right shoulder
      "M135,75 C142,72 145,80 142,90 L125,88 C125,80 128,74 135,75Z",
    ],
    labelPos: { x: 100, y: 77 },
  },
  triceps: {
    paths: [
      // Left tricep (back of arm)
      "M55,92 C50,95 48,115 50,130 L60,128 C62,115 60,98 55,92Z",
      // Right tricep
      "M145,92 C150,95 152,115 150,130 L140,128 C138,115 140,98 145,92Z",
    ],
    labelPos: { x: 100, y: 115 },
  },
  biceps: {
    paths: [
      // Left bicep
      "M58,92 C55,95 52,110 54,125 L64,123 C65,110 63,98 58,92Z",
      // Right bicep
      "M142,92 C145,95 148,110 146,125 L136,123 C135,110 137,98 142,92Z",
    ],
    labelPos: { x: 100, y: 110 },
  },
  dos: {
    paths: [
      // Upper back (traps area) — shown as mid-back on front view
      "M80,108 C82,115 85,130 85,140 L100,140 L115,140 C115,130 118,115 120,108 L100,106Z",
    ],
    labelPos: { x: 100, y: 128 },
  },
  jambes: {
    paths: [
      // Left quad
      "M78,195 C75,210 73,240 72,275 L90,275 C92,240 93,210 92,195Z",
      // Right quad
      "M122,195 C125,210 127,240 128,275 L110,275 C108,240 107,210 108,195Z",
    ],
    labelPos: { x: 100, y: 240 },
  },
};

// Body outline path
const BODY_OUTLINE = `
  M100,20
  C108,20 115,25 115,35
  C115,45 110,52 108,55
  L120,60 C130,62 140,68 142,75
  C148,72 152,78 150,88
  C155,92 158,110 156,135
  C154,145 148,148 142,145
  L135,175
  C130,185 128,192 125,195
  L128,275
  C130,290 132,310 130,330
  C128,345 120,355 115,365
  L110,370
  C105,360 100,355 100,350
  C100,355 95,360 90,370
  L85,365
  C80,355 72,345 70,330
  C68,310 70,290 72,275
  L75,195
  C72,192 70,185 65,175
  L58,145
  C52,148 46,145 44,135
  C42,110 45,92 50,88
  C48,78 52,72 58,75
  C60,68 70,62 80,60
  L92,55
  C90,52 85,45 85,35
  C85,25 92,20 100,20Z
`;

export function BodyMap() {
  const db = useSQLiteContext();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const [muscleData, setMuscleData] = useState<Map<string, MuscleVolumeData>>(new Map());

  const load = useCallback(async () => {
    const data = await getMuscleVolumeThisWeek(db);
    const map = new Map<string, MuscleVolumeData>();
    for (const d of data) {
      if (d.muscle_group) map.set(d.muscle_group, d);
    }
    setMuscleData(map);
  }, [db]);

  useEffect(() => {
    load();
  }, [load]);

  const maxVolume = Math.max(
    ...Array.from(muscleData.values()).map((d) => d.volume),
    1
  );

  const muscleGroups: MuscleGroup[] = ["pecs", "epaules", "triceps", "biceps", "dos", "jambes"];

  return (
    <Animated.View entering={FadeIn.duration(500)}>
      <Card variant="elevated" className="mb-4">
        <Text className="text-sm font-semibold text-textSecondary mb-1">
          {t("stats.bodyMap")}
        </Text>
        <Text className="text-xs text-textTertiary mb-3">
          {t("stats.bodyMapSubtitle")}
        </Text>

        <View className="items-center">
          <Svg width={200} height={300} viewBox="0 0 200 400">
            {/* Body outline */}
            <Path
              d={BODY_OUTLINE}
              fill={isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"}
              stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
              strokeWidth={1}
            />

            {/* Muscle groups */}
            {muscleGroups.map((group) => {
              const muscle = MUSCLE_PATHS[group];
              const volumeData = muscleData.get(group);
              const volume = volumeData?.volume ?? 0;
              const fillColor = getMuscleFillColor(volume, maxVolume, isDark);

              return (
                <G key={group}>
                  {muscle.paths.map((p, i) => (
                    <Path
                      key={`${group}-${i}`}
                      d={p}
                      fill={fillColor}
                      stroke={isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}
                      strokeWidth={0.5}
                      opacity={volume > 0 ? 0.85 : 0.4}
                    />
                  ))}
                </G>
              );
            })}
          </Svg>
        </View>

        {/* Legend */}
        <View className="flex-row justify-center gap-4 mt-2">
          {muscleGroups.map((group) => {
            const volumeData = muscleData.get(group);
            const volume = volumeData?.volume ?? 0;
            const fillColor = getMuscleFillColor(volume, maxVolume, isDark);
            const setsCount = volumeData?.sets_count ?? 0;

            return (
              <View key={group} className="items-center">
                <View
                  style={[styles.legendDot, { backgroundColor: fillColor }]}
                />
                <Text className="text-[9px] text-textTertiary mt-0.5">
                  {t(`muscleGroups.${group === "pecs" ? "chest" : group === "epaules" ? "shoulders" : group === "dos" ? "back" : group}`)}
                </Text>
                {setsCount > 0 && (
                  <Text className="text-[8px] text-textTertiary">
                    {setsCount}s
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Color legend */}
        <View className="flex-row items-center justify-center mt-3 gap-2">
          <View className="flex-row items-center gap-1">
            <View style={[styles.legendDot, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }]} />
            <Text className="text-[9px] text-textTertiary">{t("stats.bodyMapRest")}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View style={[styles.legendDot, { backgroundColor: "#30D158" }]} />
            <Text className="text-[9px] text-textTertiary">{t("stats.bodyMapFresh")}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View style={[styles.legendDot, { backgroundColor: "#FFD60A" }]} />
            <Text className="text-[9px] text-textTertiary">{t("stats.bodyMapModerate")}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View style={[styles.legendDot, { backgroundColor: "#FF453A" }]} />
            <Text className="text-[9px] text-textTertiary">{t("stats.bodyMapFatigued")}</Text>
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
