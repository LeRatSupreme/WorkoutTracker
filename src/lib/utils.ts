import * as Crypto from "expo-crypto";
import i18n from "@/i18n";
import type { MuscleGroup, WorkoutType } from "@/types";

export function generateId(): string {
  return Crypto.randomUUID();
}

export function formatDuration(startedAt: string, finishedAt?: string | null): string {
  const start = new Date(startedAt).getTime();
  const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
  const diffMs = end - start;

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) return `${hours}h${minutes.toString().padStart(2, "0")}`;
  return `${minutes}min`;
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const locale = i18n.language === "fr" ? "fr-FR" : "en-US";
  return date.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const WORKOUT_TYPE_LABELS: Record<string, string> = {
  push: "Push",
  pull: "Pull",
  legs: "Legs",
  custom: "Custom",
};

export const STATUS_EMOJI: Record<string, string> = {
  success: "✅",
  partial: "🟨",
  fail: "🟥",
};

const MUSCLE_GROUP_I18N: Record<MuscleGroup, string> = {
  pecs: "muscleGroups.chest",
  triceps: "muscleGroups.triceps",
  epaules: "muscleGroups.shoulders",
  dos: "muscleGroups.back",
  biceps: "muscleGroups.biceps",
  jambes: "muscleGroups.legs",
};

export function getMuscleGroups(): { value: MuscleGroup; label: string }[] {
  return [
    { value: "pecs", label: i18n.t("muscleGroups.chest") },
    { value: "triceps", label: i18n.t("muscleGroups.triceps") },
    { value: "epaules", label: i18n.t("muscleGroups.shoulders") },
    { value: "dos", label: i18n.t("muscleGroups.back") },
    { value: "biceps", label: i18n.t("muscleGroups.biceps") },
    { value: "jambes", label: i18n.t("muscleGroups.legs") },
  ];
}

export function getMuscleGroupLabel(group: MuscleGroup): string {
  return i18n.t(MUSCLE_GROUP_I18N[group]);
}

export const SESSION_MUSCLE_MAPPING: Record<WorkoutType, MuscleGroup[]> = {
  push: ["pecs", "triceps", "epaules"],
  pull: ["dos", "biceps"],
  legs: ["jambes"],
  custom: [],
};

export function formatReps(reps: number): string {
  return reps % 1 === 0 ? String(reps) : reps.toFixed(1);
}

export function timeAgo(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return i18n.t("timeAgo.today");
  if (diffDays === 1) return i18n.t("timeAgo.yesterday");
  if (diffDays < 7) return i18n.t("timeAgo.daysAgo", { count: diffDays });
  const weeks = Math.floor(diffDays / 7);
  if (weeks === 1) return i18n.t("timeAgo.oneWeekAgo");
  if (weeks < 4) return i18n.t("timeAgo.weeksAgo", { count: weeks });
  const months = Math.floor(diffDays / 30);
  if (months === 1) return i18n.t("timeAgo.oneMonthAgo");
  return i18n.t("timeAgo.monthsAgo", { count: months });
}
