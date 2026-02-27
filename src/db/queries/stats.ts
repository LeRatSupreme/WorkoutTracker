import type { SQLiteDatabase } from "expo-sqlite";
import type { LastPerformanceSet, WorkoutType } from "@/types";
import i18n from "@/i18n";

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
        message: i18n.t("insights.newRecord", { weight: row.max_weight }),
      });
    } else if (diff > 2.5) {
      insights.push({
        type: "progression",
        exercise_name: row.exercise_name,
        message: i18n.t("insights.progression", { diff: Math.round(diff), from: row.first_half_max, to: row.second_half_max }),
      });
    } else if (row.first_half_max > 0 && Math.abs(diff) <= 1) {
      insights.push({
        type: "stagnation",
        exercise_name: row.exercise_name,
        message: i18n.t("insights.stagnation", { weight: row.max_weight }),
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

// ─── Calendar Heatmap ─────────────────────────────────────────────

export interface HeatmapDay {
  date: string;       // YYYY-MM-DD
  volume: number;     // total volume that day
  sessionCount: number;
}

export async function getHeatmapData(
  db: SQLiteDatabase,
  year: number
): Promise<HeatmapDay[]> {
  const startDate = `${year}-01-01T00:00:00.000Z`;
  const endDate = `${year + 1}-01-01T00:00:00.000Z`;

  return db.getAllAsync<HeatmapDay>(
    `SELECT
       date(ws.started_at) as date,
       COALESCE(SUM(s.weight * el.weight_factor * s.reps), 0) as volume,
       COUNT(DISTINCT ws.id) as sessionCount
     FROM workout_sessions ws
     LEFT JOIN exercise_logs el ON el.session_id = ws.id
     LEFT JOIN sets s ON s.exercise_log_id = el.id
     WHERE ws.finished_at IS NOT NULL
       AND ws.started_at >= ? AND ws.started_at < ?
     GROUP BY date(ws.started_at)
     ORDER BY date ASC`,
    [startDate, endDate]
  );
}

// ─── Personal Records ─────────────────────────────────────────────

export interface PersonalRecord {
  exercise_id: string;
  exercise_name: string;
  muscle_group: string | null;
  best_weight: number;
  best_reps_at_weight: number;
  estimated_1rm: number;
  date: string;
}

export async function getPersonalRecords(
  db: SQLiteDatabase
): Promise<PersonalRecord[]> {
  // For each exercise, find the set with the highest estimated 1RM (Epley)
  const rows = await db.getAllAsync<{
    exercise_id: string;
    exercise_name: string;
    muscle_group: string | null;
    weight: number;
    reps: number;
    date: string;
  }>(
    `SELECT
       e.id as exercise_id,
       e.name as exercise_name,
       e.muscle_group,
       MAX(s.weight * el.weight_factor) as weight,
       (SELECT s2.reps FROM sets s2
        JOIN exercise_logs el2 ON s2.exercise_log_id = el2.id
        WHERE el2.exercise_id = e.id
        ORDER BY s2.weight * el2.weight_factor DESC, s2.reps DESC LIMIT 1) as reps,
       (SELECT ws2.started_at FROM sets s3
        JOIN exercise_logs el3 ON s3.exercise_log_id = el3.id
        JOIN workout_sessions ws2 ON el3.session_id = ws2.id
        WHERE el3.exercise_id = e.id
        ORDER BY s3.weight * el3.weight_factor DESC, s3.reps DESC LIMIT 1) as date
     FROM exercise_logs el
     JOIN exercises e ON el.exercise_id = e.id
     JOIN workout_sessions ws ON el.session_id = ws.id
     JOIN sets s ON s.exercise_log_id = el.id
     WHERE ws.finished_at IS NOT NULL
     GROUP BY e.id
     HAVING weight > 0
     ORDER BY MAX(s.weight * el.weight_factor * (1 + s.reps / 30.0)) DESC`
  );

  return rows.map((r) => ({
    exercise_id: r.exercise_id,
    exercise_name: r.exercise_name,
    muscle_group: r.muscle_group,
    best_weight: r.weight,
    best_reps_at_weight: r.reps,
    estimated_1rm: Math.round(r.weight * (1 + r.reps / 30)),
    date: r.date,
  }));
}

// ─── 1RM Progression ─────────────────────────────────────────────

export interface OneRMPoint {
  date: string;
  estimated_1rm: number;
}

export async function get1RMProgression(
  db: SQLiteDatabase,
  exerciseId: string,
  period: StatPeriod
): Promise<OneRMPoint[]> {
  const since = getPeriodDate(period);
  const whereClause = since ? "AND ws.started_at >= ?" : "";
  const params = since ? [exerciseId, since] : [exerciseId];

  const rows = await db.getAllAsync<{
    date: string;
    max_weight: number;
    reps_at_max: number;
  }>(
    `SELECT
       ws.started_at as date,
       MAX(s.weight * el.weight_factor) as max_weight,
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

  return rows.map((r) => ({
    date: r.date,
    estimated_1rm: Math.round(r.max_weight * (1 + r.reps_at_max / 30)),
  }));
}

// ─── Body Map (muscle volume this week) ───────────────────────────

export interface MuscleVolumeData {
  muscle_group: string;
  volume: number;
  sets_count: number;
  last_session_date: string | null;
}

export async function getMuscleVolumeThisWeek(
  db: SQLiteDatabase
): Promise<MuscleVolumeData[]> {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  return db.getAllAsync<MuscleVolumeData>(
    `SELECT
       e.muscle_group,
       COALESCE(SUM(s.weight * el.weight_factor * s.reps), 0) as volume,
       COUNT(s.id) as sets_count,
       MAX(ws.started_at) as last_session_date
     FROM exercise_logs el
     JOIN exercises e ON el.exercise_id = e.id
     JOIN workout_sessions ws ON el.session_id = ws.id
     JOIN sets s ON s.exercise_log_id = el.id
     WHERE ws.finished_at IS NOT NULL
       AND ws.started_at >= ?
       AND e.muscle_group IS NOT NULL
     GROUP BY e.muscle_group`,
    [monday.toISOString()]
  );
}

// ─── Session Comparison ───────────────────────────────────────────

export interface ComparisonSession {
  id: string;
  type: string;
  label: string | null;
  started_at: string;
  finished_at: string | null;
  duration_min: number;
  total_volume: number;
  total_sets: number;
  total_reps: number;
  exercises: {
    name: string;
    volume: number;
    sets: number;
    max_weight: number;
  }[];
}

export async function getComparableSessions(
  db: SQLiteDatabase,
  type: WorkoutType,
  limit: number = 20
): Promise<{ id: string; date: string; label: string | null }[]> {
  return db.getAllAsync<{ id: string; date: string; label: string | null }>(
    `SELECT id, started_at as date, label
     FROM workout_sessions
     WHERE finished_at IS NOT NULL AND type = ?
     ORDER BY started_at DESC
     LIMIT ?`,
    [type, limit]
  );
}

export async function getSessionForComparison(
  db: SQLiteDatabase,
  sessionId: string
): Promise<ComparisonSession | null> {
  const session = await db.getFirstAsync<{
    id: string;
    type: string;
    label: string | null;
    started_at: string;
    finished_at: string | null;
  }>(
    "SELECT id, type, label, started_at, finished_at FROM workout_sessions WHERE id = ?",
    [sessionId]
  );
  if (!session) return null;

  const durationMin = session.finished_at
    ? Math.round(
        (new Date(session.finished_at).getTime() - new Date(session.started_at).getTime()) / 60000
      )
    : 0;

  const exercises = await db.getAllAsync<{
    name: string;
    volume: number;
    sets: number;
    max_weight: number;
  }>(
    `SELECT
       e.name,
       COALESCE(SUM(s.weight * el.weight_factor * s.reps), 0) as volume,
       COUNT(s.id) as sets,
       COALESCE(MAX(s.weight * el.weight_factor), 0) as max_weight
     FROM exercise_logs el
     JOIN exercises e ON el.exercise_id = e.id
     LEFT JOIN sets s ON s.exercise_log_id = el.id
     WHERE el.session_id = ?
     GROUP BY e.id
     ORDER BY el."order" ASC`,
    [sessionId]
  );

  const totals = exercises.reduce(
    (acc, ex) => ({
      volume: acc.volume + ex.volume,
      sets: acc.sets + ex.sets,
    }),
    { volume: 0, sets: 0 }
  );

  const totalReps = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(s.reps), 0) as total
     FROM sets s
     JOIN exercise_logs el ON s.exercise_log_id = el.id
     WHERE el.session_id = ?`,
    [sessionId]
  );

  return {
    ...session,
    duration_min: durationMin,
    total_volume: totals.volume,
    total_sets: totals.sets,
    total_reps: totalReps?.total ?? 0,
    exercises,
  };
}
