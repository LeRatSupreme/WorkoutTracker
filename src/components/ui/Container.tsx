import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  noSafeArea?: boolean;
}

export function Container({ children, noSafeArea = false }: ContainerProps) {
  if (noSafeArea) {
    return <View className="flex-1 bg-background">{children}</View>;
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">{children}</SafeAreaView>
    </View>
  );
}
