import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle } from "react-native-svg";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/hooks/useTheme";
import type { ExerciseProgressPoint } from "@/db/queries/stats";
import { formatDate } from "@/lib/utils";

interface ProgressChartProps {
  data: ExerciseProgressPoint[];
  metric: "max_weight" | "total_volume" | "reps_at_max";
  label: string;
  unit?: string;
}

const CHART_HEIGHT = 140;
const CHART_PADDING_TOP = 20;
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

function buildAreaPath(points: { x: number; y: number }[], width: number): string {
  if (points.length < 2) return "";

  const linePath = buildBezierPath(points);
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];

  return `${linePath} L ${lastPoint.x} ${CHART_HEIGHT} L ${firstPoint.x} ${CHART_HEIGHT} Z`;
}

/** Convert hex (#RRGGBB) to rgba with lighter tone for gradient */
function hexToLightRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Lighten by mixing with white (50%)
  const lr = Math.round(r + (255 - r) * 0.5);
  const lg = Math.round(g + (255 - g) * 0.5);
  const lb = Math.round(b + (255 - b) * 0.5);
  return `rgba(${lr},${lg},${lb},${opacity})`;
}

export function ProgressChart({ data, metric, label, unit }: ProgressChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const { colors } = useTheme();

  if (data.length === 0) {
    return (
      <Card className="mb-4">
        <Text className="text-sm text-textTertiary">Pas assez de donnees</Text>
      </Card>
    );
  }

  const values = data.map((d) => d[metric]);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal - minVal || 1;

  const paddingX = 16;
  const usableWidth = chartWidth - paddingX * 2;

  const points = data.map((d, i) => ({
    x: paddingX + (data.length > 1 ? (i / (data.length - 1)) * usableWidth : usableWidth / 2),
    y: CHART_PADDING_TOP + USABLE_HEIGHT - ((d[metric] - minVal) / range) * USABLE_HEIGHT,
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
  const gradientColor = hexToLightRgba(colors.accent, 1);

  return (
    <Card className="mb-4">
      <Text className="text-sm font-semibold text-textSecondary mb-1">{label}</Text>

      {selected && (
        <View className="flex-row items-center gap-2 mb-1">
          <Text className="text-lg font-bold text-textPrimary">
            {metric === "total_volume"
              ? `${(selected[metric] / 1000).toFixed(1)}t`
              : `${Math.round(selected[metric])}${unit ?? (metric === "max_weight" ? "kg" : "")}`}
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
              <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={gradientColor} stopOpacity="0.3" />
                <Stop offset="1" stopColor={gradientColor} stopOpacity="0.02" />
              </SvgGradient>
            </Defs>

            <Path
              d={buildAreaPath(points, chartWidth)}
              fill="url(#areaGrad)"
            />

            <Path
              d={buildBezierPath(points)}
              stroke={colors.accent}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {selectedIndex !== null && points[selectedIndex] && (
              <>
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

        {chartWidth > 0 && points.length === 1 && (
          <Svg width={chartWidth} height={CHART_HEIGHT}>
            <Circle
              cx={points[0].x}
              cy={points[0].y}
              r={5}
              fill={colors.accent}
            />
          </Svg>
        )}
      </Pressable>

      <View className="flex-row justify-between mt-1">
        <Text className="text-xs text-textTertiary">
          {formatDate(data[0].date)}
        </Text>
        <Text className="text-xs text-textTertiary">
          {formatDate(data[data.length - 1].date)}
        </Text>
      </View>
    </Card>
  );
}
