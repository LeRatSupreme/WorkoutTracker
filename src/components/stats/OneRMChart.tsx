import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle, Line } from "react-native-svg";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/lib/utils";
import type { OneRMPoint } from "@/db/queries/stats";

interface OneRMChartProps {
  data: OneRMPoint[];
}

const CHART_HEIGHT = 160;
const CHART_PADDING_TOP = 24;
const CHART_PADDING_BOTTOM = 4;
const USABLE_HEIGHT = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;

function buildBezierPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cpx = (curr.x + next.x) / 2;
    path += ` C ${cpx} ${curr.y}, ${cpx} ${next.y}, ${next.x} ${next.y}`;
  }
  return path;
}

function buildAreaPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  const linePath = buildBezierPath(points);
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  return `${linePath} L ${lastPoint.x} ${CHART_HEIGHT} L ${firstPoint.x} ${CHART_HEIGHT} Z`;
}

export function OneRMChart({ data }: OneRMChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (data.length === 0) {
    return (
      <Card className="mb-4">
        <Text className="text-sm text-textTertiary">{t("stats.notEnoughData")}</Text>
      </Card>
    );
  }

  const values = data.map((d) => d.estimated_1rm);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal - minVal || 1;

  const paddingX = 16;
  const usableWidth = chartWidth - paddingX * 2;

  const points = data.map((d, i) => ({
    x: paddingX + (data.length > 1 ? (i / (data.length - 1)) * usableWidth : usableWidth / 2),
    y: CHART_PADDING_TOP + USABLE_HEIGHT - ((d.estimated_1rm - minVal) / range) * USABLE_HEIGHT,
  }));

  const handlePress = (event: { nativeEvent: { locationX: number } }) => {
    if (points.length === 0 || chartWidth === 0) return;
    const touchX = event.nativeEvent.locationX;
    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const dist = Math.abs(points[i].x - touchX);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }
    setSelectedIndex(closest);
  };

  const selected = selectedIndex !== null ? data[selectedIndex] : null;
  const firstVal = values[0];
  const lastVal = values[values.length - 1];
  const change = lastVal - firstVal;
  const changePercent = firstVal > 0 ? ((change / firstVal) * 100).toFixed(1) : "0";

  // Grid lines
  const gridLines = 3;
  const gridValues: number[] = [];
  for (let i = 0; i <= gridLines; i++) {
    gridValues.push(Math.round(minVal + (range * i) / gridLines));
  }

  return (
    <Card variant="elevated" className="mb-4">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-semibold text-textSecondary">
          {t("stats.estimated1RM")}
        </Text>
        {change !== 0 && (
          <View
            className="px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: change > 0 ? "#30D15815" : "#FF453A15",
            }}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: change > 0 ? "#30D158" : "#FF453A" }}
            >
              {change > 0 ? "+" : ""}{change}kg ({change > 0 ? "+" : ""}{changePercent}%)
            </Text>
          </View>
        )}
      </View>

      {selected && (
        <View className="flex-row items-center gap-2 mb-1">
          <Text className="text-2xl font-bold text-textPrimary">
            {selected.estimated_1rm}kg
          </Text>
          <Text className="text-xs text-textTertiary">{formatDate(selected.date)}</Text>
        </View>
      )}

      <Pressable
        onPress={handlePress}
        onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
      >
        {chartWidth > 0 && points.length >= 2 && (
          <Svg width={chartWidth} height={CHART_HEIGHT}>
            <Defs>
              <SvgGradient id="oneRMGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.accent} stopOpacity="0.2" />
                <Stop offset="1" stopColor={colors.accent} stopOpacity="0.01" />
              </SvgGradient>
            </Defs>

            {/* Grid lines */}
            {gridValues.map((v, i) => {
              const y = CHART_PADDING_TOP + USABLE_HEIGHT - ((v - minVal) / range) * USABLE_HEIGHT;
              return (
                <Line
                  key={i}
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke={colors.separator}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              );
            })}

            <Path d={buildAreaPath(points)} fill="url(#oneRMGrad)" />
            <Path
              d={buildBezierPath(points)}
              stroke={colors.accent}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
            />

            {selectedIndex !== null && points[selectedIndex] && (
              <>
                <Line
                  x1={points[selectedIndex].x}
                  y1={CHART_PADDING_TOP}
                  x2={points[selectedIndex].x}
                  y2={CHART_HEIGHT}
                  stroke={colors.accent}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  opacity={0.4}
                />
                <Circle
                  cx={points[selectedIndex].x}
                  cy={points[selectedIndex].y}
                  r={6}
                  fill="#ffffff"
                  stroke={colors.accent}
                  strokeWidth={2.5}
                />
                <Circle
                  cx={points[selectedIndex].x}
                  cy={points[selectedIndex].y}
                  r={3}
                  fill={colors.accent}
                />
              </>
            )}
          </Svg>
        )}
      </Pressable>

      <View className="flex-row justify-between mt-1">
        <Text className="text-xs text-textTertiary">
          {data.length > 0 ? formatDate(data[0].date) : ""}
        </Text>
        <Text className="text-xs text-textTertiary">
          {data.length > 0 ? formatDate(data[data.length - 1].date) : ""}
        </Text>
      </View>
    </Card>
  );
}
