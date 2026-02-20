import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Icon, Label } from "expo-router/unstable-native-tabs";
import { useTheme } from "@/hooks/useTheme";

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <NativeTabs tintColor={colors.accent}>
      <NativeTabs.Trigger name="index">
        <Icon sf="house.fill" />
        <Label>Accueil</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stats">
        <Icon sf="chart.bar.fill" />
        <Label>Stats</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history">
        <Icon sf="clock.fill" />
        <Label>Historique</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
