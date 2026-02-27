export function getGreeting(firstName: string, t: (key: string) => string): string {
  const hour = new Date().getHours();
  const name = firstName || "";
  const suffix = name ? `, ${name}` : " !";

  if (hour >= 5 && hour < 12) return `${t("greeting.morning")}${suffix}`;
  if (hour >= 12 && hour < 18) return `${t("greeting.afternoon")}${suffix}`;
  if (hour >= 18 && hour < 22) return `${t("greeting.evening")}${suffix}`;
  return `${t("greeting.night")}${suffix}${t("greeting.nightSuffix")}`;
}

interface MotivationContext {
  sessionsThisWeek: number;
  daysSinceLastSession: number | null;
}

export function getMotivationMessage(ctx: MotivationContext, t: (key: string) => string): string {
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  const firstTime = [t("motivation.firstTime1"), t("motivation.firstTime2")];
  const streak = [t("motivation.streak1"), t("motivation.streak2"), t("motivation.streak3")];
  const noSession = [t("motivation.noSession1"), t("motivation.noSession2"), t("motivation.noSession3")];
  const comeback = [t("motivation.comeback1"), t("motivation.comeback2"), t("motivation.comeback3")];

  if (ctx.daysSinceLastSession === null) return pick(firstTime);
  if (ctx.sessionsThisWeek >= 3) return pick(streak);
  if (ctx.daysSinceLastSession > 3) return pick(comeback);
  if (ctx.sessionsThisWeek === 0) return pick(noSession);

  return pick(streak);
}
