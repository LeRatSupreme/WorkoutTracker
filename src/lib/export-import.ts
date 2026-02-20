import type { SQLiteDatabase } from "expo-sqlite";

// Format d'export
interface ExportData {
  version: number;
  exported_at: string;
  exercises: ExportExercise[];
  workout_sessions: ExportWorkoutSession[];
  exercise_logs: ExportExerciseLog[];
  sets: ExportSet[];
  custom_workout_types: ExportCustomType[];
}

interface ExportExercise {
  id: string;
  name: string;
  muscle_group: string | null;
  is_cable: number;
  created_at: string;
}

interface ExportWorkoutSession {
  id: string;
  type: string;
  label: string | null;
  started_at: string;
  finished_at: string | null;
  rating: number | null;
}

interface ExportExerciseLog {
  id: string;
  session_id: string;
  exercise_id: string;
  target_reps: number | null;
  order: number;
  comment: string | null;
  weight_factor: number;
}

interface ExportSet {
  id: string;
  exercise_log_id: string;
  weight: number;
  reps: number;
  status: string;
  order: number;
  muscle_failure: number;
}

interface ExportCustomType {
  id: string;
  name: string;
  created_at: string;
}

/**
 * Exporte toute la base de donnees en JSON.
 */
export async function exportDatabase(db: SQLiteDatabase): Promise<string> {
  const [exercises, sessions, logs, sets, customTypes] = await Promise.all([
    db.getAllAsync<ExportExercise>("SELECT * FROM exercises"),
    db.getAllAsync<ExportWorkoutSession>("SELECT * FROM workout_sessions"),
    db.getAllAsync<ExportExerciseLog>("SELECT * FROM exercise_logs"),
    db.getAllAsync<ExportSet>("SELECT * FROM sets"),
    db.getAllAsync<ExportCustomType>("SELECT * FROM custom_workout_types"),
  ]);

  const data: ExportData = {
    version: 1,
    exported_at: new Date().toISOString(),
    exercises,
    workout_sessions: sessions,
    exercise_logs: logs,
    sets,
    custom_workout_types: customTypes,
  };

  return JSON.stringify(data);
}

/**
 * Valide la structure du JSON importe.
 */
function validateExportData(data: unknown): data is ExportData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    d.version === 1 &&
    Array.isArray(d.exercises) &&
    Array.isArray(d.workout_sessions) &&
    Array.isArray(d.exercise_logs) &&
    Array.isArray(d.sets) &&
    Array.isArray(d.custom_workout_types)
  );
}

/**
 * Importe les donnees JSON dans la base.
 * - "merge" : fusionne avec les donnees existantes (dedup exercices par nom+muscle_group)
 * - "replace" : vide la base et importe tout
 */
export async function importDatabase(
  db: SQLiteDatabase,
  json: string,
  mode: "merge" | "replace"
): Promise<{ exercisesCount: number; sessionsCount: number }> {
  const data = JSON.parse(json);

  if (!validateExportData(data)) {
    throw new Error("Format de fichier invalide");
  }

  let result: { exercisesCount: number; sessionsCount: number };
  await db.withTransactionAsync(async () => {
    if (mode === "replace") {
      result = await replaceAll(db, data);
    } else {
      result = await mergeData(db, data);
    }
  });
  return result!;
}

async function replaceAll(
  db: SQLiteDatabase,
  data: ExportData
): Promise<{ exercisesCount: number; sessionsCount: number }> {
  // Supprimer dans l'ordre inverse des FK
  await db.runAsync("DELETE FROM sets");
  await db.runAsync("DELETE FROM exercise_logs");
  await db.runAsync("DELETE FROM workout_sessions");
  await db.runAsync("DELETE FROM exercises");
  await db.runAsync("DELETE FROM custom_workout_types");

  // Inserer dans l'ordre des FK
  for (const e of data.exercises) {
    await db.runAsync(
      "INSERT INTO exercises (id, name, muscle_group, is_cable, created_at) VALUES (?, ?, ?, ?, ?)",
      [e.id, e.name, e.muscle_group, e.is_cable, e.created_at]
    );
  }

  for (const ct of data.custom_workout_types) {
    await db.runAsync(
      "INSERT INTO custom_workout_types (id, name, created_at) VALUES (?, ?, ?)",
      [ct.id, ct.name, ct.created_at]
    );
  }

  for (const s of data.workout_sessions) {
    await db.runAsync(
      'INSERT INTO workout_sessions (id, type, label, started_at, finished_at, rating) VALUES (?, ?, ?, ?, ?, ?)',
      [s.id, s.type, s.label, s.started_at, s.finished_at, s.rating]
    );
  }

  for (const el of data.exercise_logs) {
    await db.runAsync(
      'INSERT INTO exercise_logs (id, session_id, exercise_id, target_reps, "order", comment, weight_factor) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [el.id, el.session_id, el.exercise_id, el.target_reps, el.order, el.comment, el.weight_factor]
    );
  }

  for (const s of data.sets) {
    await db.runAsync(
      'INSERT INTO sets (id, exercise_log_id, weight, reps, status, "order", muscle_failure) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [s.id, s.exercise_log_id, s.weight, s.reps, s.status, s.order, s.muscle_failure]
    );
  }

  return {
    exercisesCount: data.exercises.length,
    sessionsCount: data.workout_sessions.length,
  };
}

async function mergeData(
  db: SQLiteDatabase,
  data: ExportData
): Promise<{ exercisesCount: number; sessionsCount: number }> {
  // 1. Dedup exercices par (name, muscle_group)
  const existingExercises = await db.getAllAsync<{
    id: string;
    name: string;
    muscle_group: string | null;
  }>("SELECT id, name, muscle_group FROM exercises");

  // Map: "name|muscle_group" → local id
  const exerciseMap = new Map<string, string>();
  for (const e of existingExercises) {
    exerciseMap.set(`${e.name}|${e.muscle_group}`, e.id);
  }

  // Map: imported exercise id → local id (pour remapper les exercise_logs)
  const exerciseIdRemap = new Map<string, string>();
  let newExercises = 0;

  for (const e of data.exercises) {
    const key = `${e.name}|${e.muscle_group}`;
    const existingId = exerciseMap.get(key);

    if (existingId) {
      // Exercice deja present localement → on remappe
      exerciseIdRemap.set(e.id, existingId);
    } else {
      // Nouvel exercice → on insere
      await db.runAsync(
        "INSERT OR IGNORE INTO exercises (id, name, muscle_group, is_cable, created_at) VALUES (?, ?, ?, ?, ?)",
        [e.id, e.name, e.muscle_group, e.is_cable, e.created_at]
      );
      exerciseIdRemap.set(e.id, e.id);
      exerciseMap.set(key, e.id);
      newExercises++;
    }
  }

  // 2. Custom workout types (INSERT OR IGNORE par id)
  for (const ct of data.custom_workout_types) {
    await db.runAsync(
      "INSERT OR IGNORE INTO custom_workout_types (id, name, created_at) VALUES (?, ?, ?)",
      [ct.id, ct.name, ct.created_at]
    );
  }

  // 3. Sessions (INSERT OR IGNORE par id)
  let newSessions = 0;
  for (const s of data.workout_sessions) {
    const result = await db.runAsync(
      'INSERT OR IGNORE INTO workout_sessions (id, type, label, started_at, finished_at, rating) VALUES (?, ?, ?, ?, ?, ?)',
      [s.id, s.type, s.label, s.started_at, s.finished_at, s.rating]
    );
    if (result.changes > 0) newSessions++;
  }

  // 4. Exercise logs (avec remap exercise_id)
  for (const el of data.exercise_logs) {
    const remappedExerciseId = exerciseIdRemap.get(el.exercise_id) ?? el.exercise_id;
    await db.runAsync(
      'INSERT OR IGNORE INTO exercise_logs (id, session_id, exercise_id, target_reps, "order", comment, weight_factor) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [el.id, el.session_id, remappedExerciseId, el.target_reps, el.order, el.comment, el.weight_factor]
    );
  }

  // 5. Sets (INSERT OR IGNORE par id)
  for (const s of data.sets) {
    await db.runAsync(
      'INSERT OR IGNORE INTO sets (id, exercise_log_id, weight, reps, status, "order", muscle_failure) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [s.id, s.exercise_log_id, s.weight, s.reps, s.status, s.order, s.muscle_failure]
    );
  }

  return {
    exercisesCount: newExercises,
    sessionsCount: newSessions,
  };
}
