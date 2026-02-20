import { View, Text } from "react-native";

interface EmptyStateProps {
  message: string;
  icon?: string;
}

export function EmptyState({ message, icon = "📋" }: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-16">
      <Text className="text-4xl mb-3">{icon}</Text>
      <Text className="text-base text-textTertiary text-center">{message}</Text>
    </View>
  );
}
