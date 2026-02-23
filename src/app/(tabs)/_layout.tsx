import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Icon, Label, VectorIcon } from "expo-router/unstable-native-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "@/hooks/useTheme";

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <NativeTabs tintColor={colors.accent}>
      <NativeTabs.Trigger name="index">
        <Icon sf="house.fill" androidSrc={<VectorIcon family={Ionicons} name="home" />} />
        <Label>Accueil</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stats">
        <Icon sf="chart.bar.fill" androidSrc={<VectorIcon family={Ionicons} name="bar-chart" />} />
        <Label>Stats</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history">
        <Icon sf="clock.fill" androidSrc={<VectorIcon family={Ionicons} name="time" />} />
        <Label>Historique</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
