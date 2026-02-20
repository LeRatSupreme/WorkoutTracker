import type { SQLiteDatabase } from "expo-sqlite";
import * as Crypto from "expo-crypto";
import type { Set, SetStatus } from "@/types";

export async function addSet(
  db: SQLiteDatabase,
  exerciseLogId: string,
  weight: number,
  reps: number,
  status: SetStatus,
  order: number,
  muscleFailure: boolean = false
): Promise<Set> {
  const id = Crypto.randomUUID();

  await db.runAsync(
    `INSERT INTO sets (id, exercise_log_id, weight, reps, status, "order", muscle_failure) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, exerciseLogId, weight, reps, status, order, muscleFailure ? 1 : 0]
  );

  return { id, exercise_log_id: exerciseLogId, weight, reps, status, order, muscle_failure: muscleFailure };
}

export async function removeSet(
  db: SQLiteDatabase,
  setId: string
): Promise<void> {
  await db.runAsync("DELETE FROM sets WHERE id = ?", [setId]);
}

export async function updateSet(
  db: SQLiteDatabase,
  setId: string,
  weight: number,
  reps: number,
  status: SetStatus,
  muscleFailure: boolean = false
): Promise<void> {
  await db.runAsync(
    `UPDATE sets SET weight = ?, reps = ?, status = ?, muscle_failure = ? WHERE id = ?`,
    [weight, reps, status, muscleFailure ? 1 : 0, setId]
  );
}

interface SetRow {
  id: string;
  exercise_log_id: string;
  weight: number;
  reps: number;
  status: string;
  order: number;
  muscle_failure: number;
}

export async function getSetsForLog(
  db: SQLiteDatabase,
  exerciseLogId: string
): Promise<Set[]> {
  const rows = await db.getAllAsync<SetRow>(
    `SELECT * FROM sets WHERE exercise_log_id = ? ORDER BY "order" ASC`,
    [exerciseLogId]
  );
  return rows.map((r) => ({
    ...r,
    status: r.status as SetStatus,
    muscle_failure: !!r.muscle_failure,
  }));
}
