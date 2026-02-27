import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Icon, Label, VectorIcon } from "expo-router/unstable-native-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";

export default function TabsLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <NativeTabs tintColor={colors.accent}>
      <NativeTabs.Trigger name="index">
        <Icon sf="house.fill" androidSrc={<VectorIcon family={Ionicons} name="home" />} />
        <Label>{t("tabs.home")}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stats">
        <Icon sf="chart.bar.fill" androidSrc={<VectorIcon family={Ionicons} name="bar-chart" />} />
        <Label>{t("tabs.stats")}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history">
        <Icon sf="clock.fill" androidSrc={<VectorIcon family={Ionicons} name="time" />} />
        <Label>{t("tabs.history")}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
