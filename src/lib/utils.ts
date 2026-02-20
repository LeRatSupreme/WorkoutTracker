import * as Crypto from "expo-crypto";
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
  return date.toLocaleDateString("fr-FR", {
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

export const MUSCLE_GROUPS: { value: MuscleGroup; label: string }[] = [
  { value: "pecs", label: "Pecs" },
  { value: "triceps", label: "Triceps" },
  { value: "epaules", label: "Épaules" },
  { value: "dos", label: "Dos" },
  { value: "biceps", label: "Biceps" },
  { value: "jambes", label: "Jambes" },
];

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  pecs: "Pecs",
  triceps: "Triceps",
  epaules: "Épaules",
  dos: "Dos",
  biceps: "Biceps",
  jambes: "Jambes",
};

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

  if (diffDays === 0) return "aujourd'hui";
  if (diffDays === 1) return "hier";
  if (diffDays < 7) return `il y a ${diffDays} jours`;
  const weeks = Math.floor(diffDays / 7);
  if (weeks === 1) return "il y a 1 semaine";
  if (weeks < 4) return `il y a ${weeks} semaines`;
  const months = Math.floor(diffDays / 30);
  if (months === 1) return "il y a 1 mois";
  return `il y a ${months} mois`;
}
