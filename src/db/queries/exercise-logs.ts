import type { SQLiteDatabase } from "expo-sqlite";
import * as Crypto from "expo-crypto";
import type { ExerciseLog } from "@/types";

export async function createExerciseLog(
  db: SQLiteDatabase,
  sessionId: string,
  exerciseId: string,
  order: number,
  targetReps?: number
): Promise<ExerciseLog> {
  const id = Crypto.randomUUID();

  await db.runAsync(
    `INSERT INTO exercise_logs (id, session_id, exercise_id, target_reps, "order") VALUES (?, ?, ?, ?, ?)`,
    [id, sessionId, exerciseId, targetReps ?? null, order]
  );

  return {
    id,
    session_id: sessionId,
    exercise_id: exerciseId,
    target_reps: targetReps ?? null,
    order,
    comment: null,
    weight_factor: 1.0,
  };
}

export async function updateComment(
  db: SQLiteDatabase,
  logId: string,
  comment: string | null
): Promise<void> {
  await db.runAsync(
    "UPDATE exercise_logs SET comment = ? WHERE id = ?",
    [comment, logId]
  );
}

export async function updateWeightFactor(
  db: SQLiteDatabase,
  logId: string,
  weightFactor: number
): Promise<void> {
  await db.runAsync(
    "UPDATE exercise_logs SET weight_factor = ? WHERE id = ?",
    [weightFactor, logId]
  );
}

export async function deleteExerciseLog(
  db: SQLiteDatabase,
  logId: string
): Promise<void> {
  await db.runAsync("DELETE FROM exercise_logs WHERE id = ?", [logId]);
}

export async function getLogsForSession(
  db: SQLiteDatabase,
  sessionId: string
): Promise<ExerciseLog[]> {
  return db.getAllAsync<ExerciseLog>(
    `SELECT * FROM exercise_logs WHERE session_id = ? ORDER BY "order" ASC`,
    [sessionId]
  );
}
