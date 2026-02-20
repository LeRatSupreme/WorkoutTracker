import type { SQLiteDatabase } from "expo-sqlite";
import * as Crypto from "expo-crypto";
import type { Exercise, MuscleGroup, WorkoutType } from "@/types";

export interface ExerciseWithFrequency extends Exercise {
  usage_count: number;
}

export async function getAllExercises(db: SQLiteDatabase): Promise<Exercise[]> {
  return db.getAllAsync<Exercise>(
    "SELECT * FROM exercises ORDER BY name ASC"
  );
}

export async function getExercisesByFrequency(
  db: SQLiteDatabase
): Promise<ExerciseWithFrequency[]> {
  return db.getAllAsync<ExerciseWithFrequency>(
    `SELECT e.*, COALESCE(freq.cnt, 0) as usage_count
     FROM exercises e
     LEFT JOIN (
       SELECT exercise_id, COUNT(*) as cnt
       FROM exercise_logs
       GROUP BY exercise_id
     ) freq ON freq.exercise_id = e.id
     ORDER BY usage_count DESC, e.name ASC`
  );
}

export async function searchExercises(
  db: SQLiteDatabase,
  query: string
): Promise<ExerciseWithFrequency[]> {
  return db.getAllAsync<ExerciseWithFrequency>(
    `SELECT e.*, COALESCE(freq.cnt, 0) as usage_count
     FROM exercises e
     LEFT JOIN (
       SELECT exercise_id, COUNT(*) as cnt
       FROM exercise_logs
       GROUP BY exercise_id
     ) freq ON freq.exercise_id = e.id
     WHERE e.name LIKE ?
     ORDER BY usage_count DESC, e.name ASC`,
    [`%${query}%`]
  );
}

export async function createExercise(
  db: SQLiteDatabase,
  name: string,
  muscleGroup: MuscleGroup,
  isCable: boolean = false
): Promise<Exercise> {
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();

  await db.runAsync(
    "INSERT INTO exercises (id, name, muscle_group, is_cable, created_at) VALUES (?, ?, ?, ?, ?)",
    [id, name, muscleGroup, isCable ? 1 : 0, now]
  );

  return { id, name, muscle_group: muscleGroup, is_cable: isCable, created_at: now };
}

export async function getExerciseUsageCount(
  db: SQLiteDatabase,
  exerciseId: string
): Promise<number> {
  const result = await db.getFirstAsync<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM exercise_logs WHERE exercise_id = ?",
    [exerciseId]
  );
  return result?.cnt ?? 0;
}

export async function deleteExercise(
  db: SQLiteDatabase,
  exerciseId: string
): Promise<void> {
  // Supprimer les sets liés via exercise_logs
  await db.runAsync(
    `DELETE FROM sets WHERE exercise_log_id IN (
      SELECT id FROM exercise_logs WHERE exercise_id = ?
    )`,
    [exerciseId]
  );
  // Supprimer les exercise_logs
  await db.runAsync(
    "DELETE FROM exercise_logs WHERE exercise_id = ?",
    [exerciseId]
  );
  // Supprimer l'exercice
  await db.runAsync(
    "DELETE FROM exercises WHERE id = ?",
    [exerciseId]
  );
}

export async function getSuggestedExercises(
  db: SQLiteDatabase,
  type: WorkoutType,
  label?: string | null
): Promise<Exercise[]> {
  return db.getAllAsync<Exercise>(
    `SELECT e.*, COUNT(el.id) as usage_count
     FROM exercises e
     JOIN exercise_logs el ON el.exercise_id = e.id
     JOIN workout_sessions ws ON ws.id = el.session_id
     WHERE ws.finished_at IS NOT NULL
       AND ws.type = ?
       AND (? IS NULL OR ws.label = ?)
     GROUP BY e.id
     ORDER BY usage_count DESC
     LIMIT 5`,
    [type, label ?? null, label ?? null]
  );
}
