import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import { getHeatmapData, type HeatmapDay } from "@/db/queries/stats";

/* ── helpers ── */
const DAY_LABEL_WIDTH = 22;
const CARD_H_PAD = 32; // Card p-4 = 16 * 2
const SCREEN_H_PAD = 40; // px-5 = 20 * 2
const MIN_CELL = 10;
const MAX_CELL = 14;
const GAP = 2;

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmtKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fmtHumanDate(iso: string, t: (k: string) => string): string {
  const d = new Date(iso + "T00:00:00");
  const day = d.getDate();
  const MONTHS = [
    t("stats.months.jan"), t("stats.months.feb"), t("stats.months.mar"),
    t("stats.months.apr"), t("stats.months.may"), t("stats.months.jun"),
    t("stats.months.jul"), t("stats.months.aug"), t("stats.months.sep"),
    t("stats.months.oct"), t("stats.months.nov"), t("stats.months.dec"),
  ];
  return `${day} ${MONTHS[d.getMonth()]}`;
}

function intensityLevel(volume: number, maxV: number): number {
  if (volume === 0) return 0;
  if (maxV === 0) return 1;
  const r = volume / maxV;
  if (r < 0.25) return 1;
  if (r < 0.5) return 2;
  if (r < 0.75) return 3;
  return 4;
}

const COLORS_DARK = [
  "rgba(255,255,255,0.05)",
  "#0E4429",
  "#006D32",
  "#26A641",
  "#39D353",
];
const COLORS_LIGHT = [
  "rgba(0,0,0,0.05)",
  "#9BE9A8",
  "#40C463",
  "#30A14E",
  "#216E39",
];

const MONTH_KEYS = [
  "stats.months.jan", "stats.months.feb", "stats.months.mar",
  "stats.months.apr", "stats.months.may", "stats.months.jun",
  "stats.months.jul", "stats.months.aug", "stats.months.sep",
  "stats.months.oct", "stats.months.nov", "stats.months.dec",
];

/* ── component ── */
export function CalendarHeatmap() {
  const db = useSQLiteContext();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { width: screenW } = useWindowDimensions();

  const [data, setData] = useState<Map<string, HeatmapDay>>(new Map());
  const [selectedDay, setSelectedDay] = useState<HeatmapDay | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [totalSessions, setTotalSessions] = useState(0);

  /* Load data */
  const loadData = useCallback(async () => {
    const rows = await getHeatmapData(db, year);
    const map = new Map<string, HeatmapDay>();
    let s = 0;
    for (const day of rows) {
      map.set(day.date, day);
      s += day.sessionCount;
    }
    setData(map);
    setTotalSessions(s);
    setSelectedDay(null);
  }, [db, year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* Compute responsive grid layout */
  const available = screenW - SCREEN_H_PAD - CARD_H_PAD - DAY_LABEL_WIDTH - 4;
  // How many weeks can fit?
  const weeksCount = Math.min(
    Math.floor((available + GAP) / (MIN_CELL + GAP)),
    26
  );
  // Best cell size to fill the width
  const cellSize = Math.min(
    MAX_CELL,
    Math.max(MIN_CELL, Math.floor((available - (weeksCount - 1) * GAP) / weeksCount))
  );
  const radius = cellSize <= 11 ? 2 : 3;

  const palette = isDark ? COLORS_DARK : COLORS_LIGHT;
  const maxVol = Math.max(...Array.from(data.values()).map((d) => d.volume), 1);

  /* Build weeks grid backward from today */
  const today = new Date();
  const todayStr = fmtKey(today);
  const thisMonday = getMonday(today);

  const weeks = useMemo(() => {
    const result: { date: Date; key: string }[][] = [];
    const startMonday = new Date(thisMonday);
    startMonday.setDate(startMonday.getDate() - (weeksCount - 1) * 7);

    for (let w = 0; w < weeksCount; w++) {
      const week: { date: Date; key: string }[] = [];
      for (let d = 0; d < 7; d++) {
        const cell = new Date(startMonday);
        cell.setDate(cell.getDate() + w * 7 + d);
        week.push({ date: cell, key: fmtKey(cell) });
      }
      result.push(week);
    }
    return result;
  }, [weeksCount, thisMonday.getTime()]);

  /* Month labels */
  const monthLabels = useMemo(() => {
    const labels: { text: string; x: number }[] = [];
    let prevMonth = -1;
    for (let w = 0; w < weeks.length; w++) {
      const month = weeks[w][0].date.getMonth();
      if (month !== prevMonth) {
        labels.push({
          text: t(MONTH_KEYS[month]),
          x: w * (cellSize + GAP),
        });
        prevMonth = month;
      }
    }
    return labels;
  }, [weeks, cellSize, t]);

  const DAY_LABELS = [
    { idx: 0, label: t("stats.dayLabels.mon") },
    { idx: 2, label: t("stats.dayLabels.wed") },
    { idx: 4, label: t("stats.dayLabels.fri") },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <Animated.View entering={FadeIn.duration(400)}>
      <Card variant="elevated" className="mb-4">
        {/* ── Header ── */}
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-1">
            <Text className="text-base font-bold text-textPrimary">
              {t("stats.activityCalendar")}
            </Text>
            <Text className="text-xs text-textTertiary mt-0.5">
              {t("stats.totalSessionsYear", { count: totalSessions, year })}
            </Text>
          </View>

          <View className="flex-row items-center" style={{ gap: 10 }}>
            <Pressable
              onPress={() => setYear((y) => y - 1)}
              hitSlop={12}
            >
              <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
            </Pressable>
            <Text className="text-sm font-bold text-textPrimary w-10 text-center">
              {year}
            </Text>
            <Pressable
              onPress={() => setYear((y) => y + 1)}
              disabled={year >= currentYear}
              hitSlop={12}
            >
              <Ionicons
                name="chevron-forward"
                size={16}
                color={year >= currentYear ? colors.fill : colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>

        {/* ── Tooltip ── */}
        {selectedDay && (
          <Animated.View
            entering={FadeInDown.duration(200)}
            style={[styles.tooltip, { backgroundColor: colors.fill }]}
          >
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Ionicons name="calendar-outline" size={13} color={colors.accent} />
              <Text className="text-xs font-semibold text-textPrimary">
                {fmtHumanDate(selectedDay.date, t)}
              </Text>
            </View>
            <View className="flex-row items-center mt-0.5" style={{ gap: 12 }}>
              <Text className="text-xs text-textSecondary">
                {selectedDay.sessionCount}{" "}
                {t("stats.sessionsCount", { count: selectedDay.sessionCount })}
              </Text>
              {selectedDay.volume > 0 && (
                <Text className="text-xs text-textSecondary">
                  {selectedDay.volume >= 1000
                    ? `${(selectedDay.volume / 1000).toFixed(1)}t`
                    : `${Math.round(selectedDay.volume)}kg`}
                </Text>
              )}
            </View>
          </Animated.View>
        )}

        {/* ── Month labels row ── */}
        <View
          style={{
            marginLeft: DAY_LABEL_WIDTH + 4,
            height: 16,
            marginTop: 8,
          }}
        >
          {monthLabels.map((m, i) => (
            <Text
              key={i}
              style={[styles.monthLabel, { left: m.x, color: colors.textTertiary }]}
            >
              {m.text}
            </Text>
          ))}
        </View>

        {/* ── Grid ── */}
        <View style={{ flexDirection: "row" }}>
          {/* Day labels */}
          <View style={{ width: DAY_LABEL_WIDTH, marginRight: 4 }}>
            {[0, 1, 2, 3, 4, 5, 6].map((d) => {
              const lbl = DAY_LABELS.find((l) => l.idx === d);
              return (
                <View
                  key={d}
                  style={{
                    height: cellSize + GAP,
                    justifyContent: "center",
                  }}
                >
                  {lbl && (
                    <Text
                      style={{
                        fontSize: 9,
                        color: colors.textTertiary,
                        lineHeight: cellSize,
                      }}
                    >
                      {lbl.label}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* Cells */}
          <View style={{ flexDirection: "row", gap: GAP }}>
            {weeks.map((week, wIdx) => (
              <View key={wIdx} style={{ gap: GAP }}>
                {week.map((cell) => {
                  const dayData = data.get(cell.key);
                  const vol = dayData?.volume ?? 0;
                  const level = intensityLevel(vol, maxVol);
                  const isToday = cell.key === todayStr;
                  const isFuture = cell.date > today;
                  const isSelected = selectedDay?.date === cell.key;

                  return (
                    <Pressable
                      key={cell.key}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedDay(null);
                        } else if (dayData) {
                          setSelectedDay(dayData);
                        } else {
                          setSelectedDay(null);
                        }
                      }}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        borderRadius: radius,
                        backgroundColor: isFuture
                          ? "transparent"
                          : palette[level],
                        borderWidth: isToday || isSelected ? 1.5 : 0,
                        borderColor: isToday
                          ? colors.accent
                          : isSelected
                            ? colors.textPrimary
                            : "transparent",
                      }}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* ── Legend ── */}
        <View className="flex-row items-center justify-end mt-3" style={{ gap: 3 }}>
          <Text style={{ fontSize: 9, color: colors.textTertiary, marginRight: 2 }}>
            {t("stats.less")}
          </Text>
          {palette.map((color, i) => (
            <View
              key={i}
              style={{
                width: cellSize,
                height: cellSize,
                borderRadius: radius - 1,
                backgroundColor: color,
              }}
            />
          ))}
          <Text style={{ fontSize: 9, color: colors.textTertiary, marginLeft: 2 }}>
            {t("stats.more")}
          </Text>
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
    marginTop: 4,
  },
  monthLabel: {
    position: "absolute",
    fontSize: 10,
    fontWeight: "500",
  },
});
