import type { SQLiteDatabase } from "expo-sqlite";
import * as Crypto from "expo-crypto";
import type { BodyWeightLog } from "@/types";

export async function addBodyWeightLog(
  db: SQLiteDatabase,
  weight: number,
  date?: string
): Promise<BodyWeightLog> {
  const id = Crypto.randomUUID();
  const d = date ?? new Date().toISOString().slice(0, 10);

  await db.runAsync(
    "INSERT INTO body_weight_logs (id, weight, date) VALUES (?, ?, ?)",
    [id, weight, d]
  );

  return { id, weight, date: d, synced: false, created_at: new Date().toISOString() };
}

export async function getBodyWeightLogs(
  db: SQLiteDatabase,
  limit: number = 30
): Promise<BodyWeightLog[]> {
  const rows = await db.getAllAsync<{
    id: string;
    weight: number;
    date: string;
    synced: number;
    created_at: string;
  }>(
    "SELECT * FROM body_weight_logs ORDER BY date DESC LIMIT ?",
    [limit]
  );
  return rows.map((r) => ({ ...r, synced: !!r.synced }));
}

export async function getLatestBodyWeight(
  db: SQLiteDatabase
): Promise<number | null> {
  const row = await db.getFirstAsync<{ weight: number }>(
    "SELECT weight FROM body_weight_logs ORDER BY date DESC LIMIT 1"
  );
  return row?.weight ?? null;
}

export async function deleteBodyWeightLog(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync("DELETE FROM body_weight_logs WHERE id = ?", [id]);
}

export async function markBodyWeightSynced(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync(
    "UPDATE body_weight_logs SET synced = 1 WHERE id = ?",
    [id]
  );
}
