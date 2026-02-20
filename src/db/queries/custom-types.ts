import type { SQLiteDatabase } from "expo-sqlite";
import * as Crypto from "expo-crypto";
import type { CustomWorkoutType } from "@/types";

export async function getAllCustomTypes(
  db: SQLiteDatabase
): Promise<CustomWorkoutType[]> {
  return db.getAllAsync<CustomWorkoutType>(
    "SELECT * FROM custom_workout_types ORDER BY created_at ASC"
  );
}

export async function createCustomType(
  db: SQLiteDatabase,
  name: string
): Promise<CustomWorkoutType> {
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();

  await db.runAsync(
    "INSERT INTO custom_workout_types (id, name, created_at) VALUES (?, ?, ?)",
    [id, name, now]
  );

  return { id, name, created_at: now };
}

export async function deleteCustomType(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync("DELETE FROM custom_workout_types WHERE id = ?", [id]);
}
