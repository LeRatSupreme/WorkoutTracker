export const CREATE_EXERCISES_TABLE = `
  CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    muscle_group TEXT,
    is_cable INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

export const CREATE_WORKOUT_SESSIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS workout_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('push', 'pull', 'legs', 'custom')),
    label TEXT,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    finished_at TEXT,
    rating INTEGER CHECK(rating IS NULL OR (rating >= 1 AND rating <= 5))
  );
`;

export const CREATE_EXERCISE_LOGS_TABLE = `
  CREATE TABLE IF NOT EXISTS exercise_logs (
    id TEXT PRIMARY KEY NOT NULL,
    session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL REFERENCES exercises(id),
    target_reps INTEGER,
    "order" INTEGER NOT NULL,
    comment TEXT,
    weight_factor REAL NOT NULL DEFAULT 1.0
  );
`;

export const CREATE_SETS_TABLE = `
  CREATE TABLE IF NOT EXISTS sets (
    id TEXT PRIMARY KEY NOT NULL,
    exercise_log_id TEXT NOT NULL REFERENCES exercise_logs(id) ON DELETE CASCADE,
    weight REAL NOT NULL,
    reps REAL NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('success', 'partial', 'fail')),
    "order" INTEGER NOT NULL,
    muscle_failure INTEGER NOT NULL DEFAULT 0
  );
`;

export const CREATE_CUSTOM_WORKOUT_TYPES_TABLE = `
  CREATE TABLE IF NOT EXISTS custom_workout_types (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

export const ALL_TABLES = [
  CREATE_EXERCISES_TABLE,
  CREATE_WORKOUT_SESSIONS_TABLE,
  CREATE_EXERCISE_LOGS_TABLE,
  CREATE_SETS_TABLE,
  CREATE_CUSTOM_WORKOUT_TYPES_TABLE,
];
