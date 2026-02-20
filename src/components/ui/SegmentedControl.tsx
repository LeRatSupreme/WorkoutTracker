import { View, Text, Pressable } from "react-native";

interface Segment<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  size = "md",
}: SegmentedControlProps<T>) {
  const paddingClass = size === "sm" ? "p-0.5" : "p-1";
  const itemPadding = size === "sm" ? "px-3 py-1.5" : "px-4 py-2";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <View className={`flex-row bg-fill rounded-xl ${paddingClass}`}>
      {segments.map((segment) => {
        const isActive = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            onPress={() => onChange(segment.value)}
            className={`flex-1 items-center justify-center rounded-lg ${itemPadding} ${
              isActive ? "bg-card shadow-sm" : ""
            }`}
          >
            <Text
              className={`${textSize} font-medium ${
                isActive ? "text-textPrimary" : "text-textSecondary"
              }`}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
