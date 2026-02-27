import type { SQLiteDatabase } from "expo-sqlite";
import { ALL_TABLES } from "./schema";

const CURRENT_VERSION = 6;

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version"
  );
  const currentVersion = result?.user_version ?? 0;

  console.log(`[Migration] DB version: ${currentVersion}, target: ${CURRENT_VERSION}`);

  if (currentVersion >= CURRENT_VERSION) {
    return;
  }

  await db.execAsync("PRAGMA journal_mode = WAL");
  await db.execAsync("PRAGMA foreign_keys = ON");

  if (currentVersion < 1) {
    for (const sql of ALL_TABLES) {
      await db.execAsync(sql);
    }
  }

  if (currentVersion >= 1 && currentVersion < 2) {
    // Migration v1 → v2 : recréer sets avec reps REAL + muscle_failure
    await db.execAsync("PRAGMA foreign_keys = OFF");
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sets_new (
        id TEXT PRIMARY KEY NOT NULL,
        exercise_log_id TEXT NOT NULL REFERENCES exercise_logs(id) ON DELETE CASCADE,
        weight REAL NOT NULL,
        reps REAL NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('success', 'partial', 'fail')),
        "order" INTEGER NOT NULL,
        muscle_failure INTEGER NOT NULL DEFAULT 0
      )
    `);
    await db.execAsync(`
      INSERT INTO sets_new (id, exercise_log_id, weight, reps, status, "order", muscle_failure)
      SELECT id, exercise_log_id, weight, reps, status, "order", 0 FROM sets
    `);
    await db.execAsync("DROP TABLE sets");
    await db.execAsync("ALTER TABLE sets_new RENAME TO sets");
    await db.execAsync("PRAGMA foreign_keys = ON");

    // Ajouter comment à exercise_logs
    await db.execAsync(
      "ALTER TABLE exercise_logs ADD COLUMN comment TEXT"
    );
  }

  if (currentVersion >= 1 && currentVersion < 3) {
    await db.execAsync(
      "CREATE TABLE IF NOT EXISTS custom_workout_types (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))"
    );
  }

  if (currentVersion < 4) {
    // try-catch: sur fresh install ALL_TABLES inclut deja ces colonnes
    try {
      await db.execAsync(
        "ALTER TABLE exercises ADD COLUMN is_cable INTEGER NOT NULL DEFAULT 0"
      );
    } catch (_) { /* colonne existe deja */ }
    try {
      await db.execAsync(
        "ALTER TABLE exercise_logs ADD COLUMN weight_factor REAL NOT NULL DEFAULT 1.0"
      );
    } catch (_) { /* colonne existe deja */ }
  }

  // v4→v5 : safety net — verifie que les colonnes poulie existent
  if (currentVersion < 5) {
    const elCols = await db.getAllAsync<{ name: string }>(
      "PRAGMA table_info(exercise_logs)"
    );
    if (!elCols.some((c) => c.name === "weight_factor")) {
      await db.execAsync(
        "ALTER TABLE exercise_logs ADD COLUMN weight_factor REAL NOT NULL DEFAULT 1.0"
      );
    }
    const exCols = await db.getAllAsync<{ name: string }>(
      "PRAGMA table_info(exercises)"
    );
    if (!exCols.some((c) => c.name === "is_cable")) {
      await db.execAsync(
        "ALTER TABLE exercises ADD COLUMN is_cable INTEGER NOT NULL DEFAULT 0"
      );
    }
  }

  // v5→v6 : health data columns + body weight tracking
  if (currentVersion < 6) {
    try {
      await db.execAsync(
        "ALTER TABLE workout_sessions ADD COLUMN avg_heart_rate INTEGER"
      );
    } catch (_) { /* column may already exist */ }
    try {
      await db.execAsync(
        "ALTER TABLE workout_sessions ADD COLUMN max_heart_rate INTEGER"
      );
    } catch (_) { /* column may already exist */ }
    try {
      await db.execAsync(
        "ALTER TABLE workout_sessions ADD COLUMN calories_burned INTEGER"
      );
    } catch (_) { /* column may already exist */ }
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS body_weight_logs (
        id TEXT PRIMARY KEY NOT NULL,
        weight REAL NOT NULL,
        date TEXT NOT NULL,
        synced INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`
    );
  }

  await db.execAsync(`PRAGMA user_version = ${CURRENT_VERSION}`);
  console.log("[Migration] Done, version set to", CURRENT_VERSION);
}
