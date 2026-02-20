export function getGreeting(firstName: string): string {
  const hour = new Date().getHours();
  const name = firstName || "";
  const suffix = name ? `, ${name}` : " !";

  if (hour >= 5 && hour < 12) return `Bonjour${suffix}`;
  if (hour >= 12 && hour < 18) return `Salut${suffix}`;
  if (hour >= 18 && hour < 22) return `Bonne séance${suffix}`;
  return `Encore debout${suffix} ?`;
}

interface MotivationContext {
  sessionsThisWeek: number;
  daysSinceLastSession: number | null;
}

const MESSAGES_FIRST_TIME = [
  "La première rep est la plus importante.",
  "Chaque expert a un jour été débutant.",
];

const MESSAGES_STREAK = [
  "Tu gères. Continue comme ça.",
  "La régularité, c'est la clé.",
  "Solide cette semaine.",
];

const MESSAGES_NO_SESSION = [
  "Un petit effort aujourd'hui ?",
  "Ton futur toi te remerciera.",
  "Même 20 minutes, ça compte.",
];

const MESSAGES_COMEBACK = [
  "Content de te revoir.",
  "On reprend doucement ?",
  "La pause est finie, on y retourne.",
];

export function getMotivationMessage(ctx: MotivationContext): string {
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  if (ctx.daysSinceLastSession === null) return pick(MESSAGES_FIRST_TIME);
  if (ctx.sessionsThisWeek >= 3) return pick(MESSAGES_STREAK);
  if (ctx.daysSinceLastSession > 3) return pick(MESSAGES_COMEBACK);
  if (ctx.sessionsThisWeek === 0) return pick(MESSAGES_NO_SESSION);

  return pick(MESSAGES_STREAK);
}
