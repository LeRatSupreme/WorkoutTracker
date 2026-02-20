import type { SQLiteDatabase } from "expo-sqlite";
import type { LastPerformanceSet, WorkoutType } from "@/types";

export async function getLastPerformance(
  db: SQLiteDatabase,
  exerciseId: string
): Promise<LastPerformanceSet[]> {
  return db.getAllAsync<LastPerformanceSet>(
    `SELECT s.weight * el.weight_factor as weight, s.reps, s.status, s."order", ws.started_at as session_date
     FROM exercise_logs el
     JOIN workout_sessions ws ON el.session_id = ws.id
     JOIN sets s ON s.exercise_log_id = el.id
     WHERE el.exercise_id = ? AND ws.finished_at IS NOT NULL
     ORDER BY ws.started_at DESC, s."order" ASC
     LIMIT 20`,
    [exerciseId]
  );
}

export type StatPeriod = "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL";

function getPeriodDate(period: StatPeriod): string | null {
  if (period === "ALL") return null;
  const now = new Date();
  switch (period) {
    case "1W": now.setDate(now.getDate() - 7); break;
    case "1M": now.setMonth(now.getMonth() - 1); break;
    case "3M": now.setMonth(now.getMonth() - 3); break;
    case "6M": now.setMonth(now.getMonth() - 6); break;
    case "1Y": now.setFullYear(now.getFullYear() - 1); break;
  }
  return now.toISOString();
}

export interface OverviewStats {
  total_sessions: number;
  total_volume: number;
  avg_duration_min: number;
  total_sets: number;
}

export async function getOverviewStats(
  db: SQLiteDatabase,
  period: StatPeriod
): Promise<OverviewStats> {
  const since = getPeriodDate(period);
  const whereClause = since
    ? "WHERE ws.finished_at IS NOT NULL AND ws.started_at >= ?"
    : "WHERE ws.finished_at IS NOT NULL";
  const params = since ? [since] : [];

  const result = await db.getFirstAsync<{
    total_sessions: number;
    avg_duration_min: number;
  }>(
    `SELECT
       COUNT(*) as total_sessions,
       AVG((julianday(ws.finished_at) - julianday(ws.started_at)) * 1440) as avg_duration_min
     FROM workout_sessions ws
     ${whereClause}`,
    params
  );

  const volumeResult = await db.getFirstAsync<{
    total_volume: number;
    total_sets: number;
  }>(
    `SELECT
       COALESCE(SUM(s.weight * el.weight_factor * s.reps), 0) as total_volume,
       COUNT(s.id) as total_sets
     FROM sets s
     JOIN exercise_logs el ON s.exercise_log_id = el.id
     JOIN workout_sessions ws ON el.session_id = ws.id
     ${whereClause}`,
    params
  );

  return {
    total_sessions: result?.total_sessions ?? 0,
    total_volume: volumeResult?.total_volume ?? 0,
    avg_duration_min: Math.round(result?.avg_duration_min ?? 0),
    total_sets: volumeResult?.total_sets ?? 0,
  };
}

export interface ExerciseProgressPoint {
  date: string;
  max_weight: number;
  total_volume: number;
  total_reps: number;
  reps_at_max: number;
}

// ⚠️ reps_at_max subquery : NE PAS utiliser de reference correlee (ex: el.weight_factor)
// dans le ORDER BY d'une subquery avec GROUP BY dans la query externe.
// SQLite ne peut pas resoudre les alias externes dans ce contexte.
// Ici c'est OK car weight_factor est constant par exercise_log (meme facteur pour toutes les series).
export async function getExerciseProgress(
  db: SQLiteDatabase,
  exerciseId: string,
  period: StatPeriod
): Promise<ExerciseProgressPoint[]> {
  const since = getPeriodDate(period);
  const whereClause = since
    ? "AND ws.started_at >= ?"
    : "";
  const params = since ? [exerciseId, since] : [exerciseId];

  return db.getAllAsync<ExerciseProgressPoint>(
    `SELECT
       ws.started_at as date,
       MAX(s.weight * el.weight_factor) as max_weight,
       SUM(s.weight * el.weight_factor * s.reps) as total_volume,
       SUM(s.reps) as total_reps,
       (SELECT s2.reps FROM sets s2
        WHERE s2.exercise_log_id = el.id
        ORDER BY s2.weight DESC, s2.reps DESC LIMIT 1) as reps_at_max
     FROM exercise_logs el
     JOIN workout_sessions ws ON el.session_id = ws.id
     JOIN sets s ON s.exercise_log_id = el.id
     WHERE el.exercise_id = ? AND ws.finished_at IS NOT NULL ${whereClause}
     GROUP BY ws.id
     ORDER BY ws.started_at ASC`,
    params
  );
}

export interface SessionTypeStats {
  total_sessions: number;
  total_volume: number;
  avg_duration_min: number;
}

export async function getSessionTypeStats(
  db: SQLiteDatabase,
  type: WorkoutType,
  period: StatPeriod
): Promise<SessionTypeStats> {
  const since = getPeriodDate(period);
  const whereClause = since
    ? "WHERE ws.finished_at IS NOT NULL AND ws.type = ? AND ws.started_at >= ?"
    : "WHERE ws.finished_at IS NOT NULL AND ws.type = ?";
  const params = since ? [type, since] : [type];

  const result = await db.getFirstAsync<{
    total_sessions: number;
    avg_duration_min: number;
  }>(
    `SELECT
       COUNT(*) as total_sessions,
       AVG((julianday(ws.finished_at) - julianday(ws.started_at)) * 1440) as avg_duration_min
     FROM workout_sessions ws
     ${whereClause}`,
    params
  );

  const volumeParams = since ? [type, since] : [type];
  const volumeResult = await db.getFirstAsync<{ total_volume: number }>(
    `SELECT COALESCE(SUM(s.weight * el.weight_factor * s.reps), 0) as total_volume
     FROM sets s
     JOIN exercise_logs el ON s.exercise_log_id = el.id
     JOIN workout_sessions ws ON el.session_id = ws.id
     ${whereClause}`,
    volumeParams
  );

  return {
    total_sessions: result?.total_sessions ?? 0,
    total_volume: volumeResult?.total_volume ?? 0,
    avg_duration_min: Math.round(result?.avg_duration_min ?? 0),
  };
}

export interface TopExercise {
  exercise_id: string;
  exercise_name: string;
  usage_count: number;
  max_weight: number;
  prev_max_weight: number;
}

function getMidpointDate(period: StatPeriod): string | null {
  if (period === "ALL") return null;
  const now = new Date();
  switch (period) {
    case "1W": now.setDate(now.getDate() - 3); break;
    case "1M": now.setDate(now.getDate() - 15); break;
    case "3M": now.setMonth(now.getMonth() - 1); now.setDate(now.getDate() - 15); break;
    case "6M": now.setMonth(now.getMonth() - 3); break;
    case "1Y": now.setMonth(now.getMonth() - 6); break;
  }
  return now.toISOString();
}

export async function getTopExercises(
  db: SQLiteDatabase,
  period: StatPeriod,
  limit: number = 10,
  type?: WorkoutType
): Promise<TopExercise[]> {
  const since = getPeriodDate(period);
  const mid = getMidpointDate(period);

  // Conditions principales
  const conditions: string[] = ["ws.finished_at IS NOT NULL"];
  const params: (string | number)[] = [];
  if (since) { conditions.push("ws.started_at >= ?"); params.push(since); }
  if (type) { conditions.push("ws.type = ?"); params.push(type); }
  const whereClause = "WHERE " + conditions.join(" AND ");

  // Conditions subquery (premiere moitie de la periode)
  const subConditions: string[] = ["ws2.finished_at IS NOT NULL", "el2.exercise_id = e.id"];
  const subParams: (string | number)[] = [];
  if (since) { subConditions.push("ws2.started_at >= ?"); subParams.push(since); }
  if (type) { subConditions.push("ws2.type = ?"); subParams.push(type); }
  if (mid) { subConditions.push("ws2.started_at < ?"); subParams.push(mid); }
  const subWhere = "WHERE " + subConditions.join(" AND ");

  return db.getAllAsync<TopExercise>(
    `SELECT
       e.id as exercise_id,
       e.name as exercise_name,
       COUNT(DISTINCT el.id) as usage_count,
       COALESCE(MAX(s.weight * el.weight_factor), 0) as max_weight,
       COALESCE((
         SELECT MAX(s2.weight * el2.weight_factor)
         FROM sets s2
         JOIN exercise_logs el2 ON s2.exercise_log_id = el2.id
         JOIN workout_sessions ws2 ON el2.session_id = ws2.id
         ${subWhere}
       ), 0) as prev_max_weight
     FROM exercise_logs el
     JOIN exercises e ON el.exercise_id = e.id
     JOIN workout_sessions ws ON el.session_id = ws.id
     LEFT JOIN sets s ON s.exercise_log_id = el.id
     ${whereClause}
     GROUP BY e.id
     ORDER BY usage_count DESC
     LIMIT ?`,
    [...subParams, ...params, limit]
  );
}

// --- Insights ---

export interface Insight {
  type: "progression" | "stagnation" | "record";
  exercise_name: string;
  message: string;
}

export async function getInsights(
  db: SQLiteDatabase,
  period: StatPeriod
): Promise<Insight[]> {
  const since = getPeriodDate(period);
  const mid = getMidpointDate(period);

  const conditions: string[] = ["ws.finished_at IS NOT NULL"];
  const params: (string | number)[] = [];
  if (since) { conditions.push("ws.started_at >= ?"); params.push(since); }
  const whereClause = "WHERE " + conditions.join(" AND ");

  interface ExerciseInsightRow {
    exercise_name: string;
    usage_count: number;
    max_weight: number;
    first_half_max: number;
    second_half_max: number;
    all_time_max: number;
  }

  const midDate = mid ?? since ?? "";
  const rows = await db.getAllAsync<ExerciseInsightRow>(
    `SELECT
       e.name as exercise_name,
       COUNT(DISTINCT el.id) as usage_count,
       COALESCE(MAX(s.weight * el.weight_factor), 0) as max_weight,
       COALESCE((
         SELECT MAX(s2.weight * el2.weight_factor) FROM sets s2
         JOIN exercise_logs el2 ON s2.exercise_log_id = el2.id
         JOIN workout_sessions ws2 ON el2.session_id = ws2.id
         WHERE ws2.finished_at IS NOT NULL AND el2.exercise_id = e.id
         ${since ? "AND ws2.started_at >= ?" : ""}
         ${mid ? "AND ws2.started_at < ?" : ""}
       ), 0) as first_half_max,
       COALESCE((
         SELECT MAX(s3.weight * el3.weight_factor) FROM sets s3
         JOIN exercise_logs el3 ON s3.exercise_log_id = el3.id
         JOIN workout_sessions ws3 ON el3.session_id = ws3.id
         WHERE ws3.finished_at IS NOT NULL AND el3.exercise_id = e.id
         ${mid ? "AND ws3.started_at >= ?" : ""}
       ), 0) as second_half_max,
       COALESCE((
         SELECT MAX(s4.weight * el4.weight_factor) FROM sets s4
         JOIN exercise_logs el4 ON s4.exercise_log_id = el4.id
         JOIN workout_sessions ws4 ON el4.session_id = ws4.id
         WHERE ws4.finished_at IS NOT NULL AND el4.exercise_id = e.id
       ), 0) as all_time_max
     FROM exercise_logs el
     JOIN exercises e ON el.exercise_id = e.id
     JOIN workout_sessions ws ON el.session_id = ws.id
     LEFT JOIN sets s ON s.exercise_log_id = el.id
     ${whereClause}
     GROUP BY e.id
     HAVING usage_count >= 2
     ORDER BY usage_count DESC`,
    [
      ...(since ? [since] : []),
      ...(mid ? [midDate] : []),
      ...(mid ? [midDate] : []),
      ...params,
    ]
  );

  const insights: Insight[] = [];
  for (const row of rows) {
    const diff = row.second_half_max - row.first_half_max;

    if (row.max_weight > 0 && row.max_weight >= row.all_time_max && row.first_half_max < row.max_weight) {
      insights.push({
        type: "record",
        exercise_name: row.exercise_name,
        message: `Nouveau record : ${row.max_weight}kg !`,
      });
    } else if (diff > 2.5) {
      insights.push({
        type: "progression",
        exercise_name: row.exercise_name,
        message: `+${Math.round(diff)}kg (${row.first_half_max}→${row.second_half_max}kg)`,
      });
    } else if (row.first_half_max > 0 && Math.abs(diff) <= 1) {
      insights.push({
        type: "stagnation",
        exercise_name: row.exercise_name,
        message: `Stagne à ${row.max_weight}kg`,
      });
    }
  }

  return insights;
}

// --- Exercise History ---

export interface ExerciseHistorySet {
  weight: number;
  reps: number;
  status: string;
  order: number;
  muscle_failure: number;
}

export interface ExerciseHistorySession {
  session_id: string;
  date: string;
  session_type: string;
  session_label: string | null;
  sets: ExerciseHistorySet[];
}

export async function getExerciseHistory(
  db: SQLiteDatabase,
  exerciseId: string,
  period: StatPeriod
): Promise<ExerciseHistorySession[]> {
  const since = getPeriodDate(period);
  const conditions: string[] = [
    "el.exercise_id = ?",
    "ws.finished_at IS NOT NULL",
  ];
  const params: (string | number)[] = [exerciseId];
  if (since) { conditions.push("ws.started_at >= ?"); params.push(since); }

  interface HistoryRow {
    session_id: string;
    date: string;
    session_type: string;
    session_label: string | null;
    weight: number;
    reps: number;
    status: string;
    set_order: number;
    muscle_failure: number;
  }

  const rows = await db.getAllAsync<HistoryRow>(
    `SELECT
       ws.id as session_id,
       ws.started_at as date,
       ws.type as session_type,
       ws.label as session_label,
       s.weight * el.weight_factor as weight,
       s.reps,
       s.status,
       s."order" as set_order,
       s.muscle_failure
     FROM exercise_logs el
     JOIN workout_sessions ws ON el.session_id = ws.id
     JOIN sets s ON s.exercise_log_id = el.id
     WHERE ${conditions.join(" AND ")}
     ORDER BY ws.started_at DESC, s."order" ASC`,
    params
  );

  // Grouper par session
  const map = new Map<string, ExerciseHistorySession>();
  for (const row of rows) {
    let session = map.get(row.session_id);
    if (!session) {
      session = {
        session_id: row.session_id,
        date: row.date,
        session_type: row.session_type,
        session_label: row.session_label,
        sets: [],
      };
      map.set(row.session_id, session);
    }
    session.sets.push({
      weight: row.weight,
      reps: row.reps,
      status: row.status,
      order: row.set_order,
      muscle_failure: row.muscle_failure,
    });
  }

  return Array.from(map.values());
}

// --- Session Durations ---

export interface SessionDurationPoint {
  date: string;
  duration_min: number;
}

export async function getSessionTypeDurations(
  db: SQLiteDatabase,
  type: WorkoutType,
  period: StatPeriod
): Promise<SessionDurationPoint[]> {
  const since = getPeriodDate(period);
  const conditions: string[] = ["ws.finished_at IS NOT NULL", "ws.type = ?"];
  const params: (string | number)[] = [type];
  if (since) { conditions.push("ws.started_at >= ?"); params.push(since); }

  return db.getAllAsync<SessionDurationPoint>(
    `SELECT
       ws.started_at as date,
       ROUND((julianday(ws.finished_at) - julianday(ws.started_at)) * 1440) as duration_min
     FROM workout_sessions ws
     WHERE ${conditions.join(" AND ")}
     ORDER BY ws.started_at ASC`,
    params
  );
}
