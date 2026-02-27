import type { SQLiteDatabase } from "expo-sqlite";
import * as Crypto from "expo-crypto";
import type {
  WorkoutSession,
  WorkoutType,
  SessionWithDetails,
  ExerciseLogWithDetails,
  Set,
} from "@/types";

export async function createSession(
  db: SQLiteDatabase,
  type: WorkoutType,
  label?: string
): Promise<WorkoutSession> {
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();

  await db.runAsync(
    "INSERT INTO workout_sessions (id, type, label, started_at) VALUES (?, ?, ?, ?)",
    [id, type, label ?? null, now]
  );

  return {
    id,
    type,
    label: label ?? null,
    started_at: now,
    finished_at: null,
    rating: null,
    avg_heart_rate: null,
    max_heart_rate: null,
    calories_burned: null,
  };
}

export async function finishSession(
  db: SQLiteDatabase,
  sessionId: string,
  rating?: number,
  healthData?: { avgHeartRate?: number; maxHeartRate?: number; caloriesBurned?: number }
): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE workout_sessions
     SET finished_at = ?, rating = ?,
         avg_heart_rate = ?, max_heart_rate = ?, calories_burned = ?
     WHERE id = ?`,
    [
      now,
      rating ?? null,
      healthData?.avgHeartRate ?? null,
      healthData?.maxHeartRate ?? null,
      healthData?.caloriesBurned ?? null,
      sessionId,
    ]
  );
}

export async function getSessionById(
  db: SQLiteDatabase,
  sessionId: string
): Promise<WorkoutSession | null> {
  return db.getFirstAsync<WorkoutSession>(
    "SELECT * FROM workout_sessions WHERE id = ?",
    [sessionId]
  );
}

export interface SessionWithCount extends WorkoutSession {
  exercise_count: number;
}

export async function getAllSessions(
  db: SQLiteDatabase
): Promise<SessionWithCount[]> {
  return db.getAllAsync<SessionWithCount>(
    `SELECT ws.*, COUNT(el.id) as exercise_count
     FROM workout_sessions ws
     LEFT JOIN exercise_logs el ON el.session_id = ws.id
     GROUP BY ws.id
     ORDER BY ws.started_at DESC`
  );
}

export async function getUnfinishedSession(
  db: SQLiteDatabase
): Promise<WorkoutSession | null> {
  return db.getFirstAsync<WorkoutSession>(
    "SELECT * FROM workout_sessions WHERE finished_at IS NULL LIMIT 1"
  );
}

export interface LastFinishedSession extends WorkoutSession {
  exercise_count: number;
}

export async function getLastFinishedSession(
  db: SQLiteDatabase
): Promise<LastFinishedSession | null> {
  return db.getFirstAsync<LastFinishedSession>(
    `SELECT ws.*, COUNT(el.id) as exercise_count
     FROM workout_sessions ws
     LEFT JOIN exercise_logs el ON el.session_id = ws.id
     WHERE ws.finished_at IS NOT NULL
     GROUP BY ws.id
     ORDER BY ws.started_at DESC
     LIMIT 1`
  );
}

export async function deleteSession(
  db: SQLiteDatabase,
  sessionId: string
): Promise<void> {
  await db.runAsync("DELETE FROM workout_sessions WHERE id = ?", [sessionId]);
}

export async function getSessionWithDetails(
  db: SQLiteDatabase,
  sessionId: string
): Promise<SessionWithDetails | null> {
  const session = await getSessionById(db, sessionId);
  if (!session) return null;

  const logs = await db.getAllAsync<ExerciseLogWithDetails & { exercise_name: string; is_cable: number }>(
    `SELECT el.*, e.name as exercise_name, e.is_cable
     FROM exercise_logs el
     JOIN exercises e ON e.id = el.exercise_id
     WHERE el.session_id = ?
     ORDER BY el."order" ASC`,
    [sessionId]
  );

  const logsWithSets: ExerciseLogWithDetails[] = await Promise.all(
    logs.map(async (log) => {
      const rows = await db.getAllAsync<{
        id: string;
        exercise_log_id: string;
        weight: number;
        reps: number;
        status: string;
        order: number;
        muscle_failure: number;
      }>(
        `SELECT * FROM sets WHERE exercise_log_id = ? ORDER BY "order" ASC`,
        [log.id]
      );
      const sets: Set[] = rows.map((r) => ({
        ...r,
        status: r.status as "success" | "partial" | "fail",
        muscle_failure: !!r.muscle_failure,
      }));
      return { ...log, sets };
    })
  );

  return { ...session, logs: logsWithSets };
}
