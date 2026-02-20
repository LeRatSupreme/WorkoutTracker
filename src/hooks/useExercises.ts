import { useState, useEffect, useCallback } from "react";
import { useSQLiteContext } from "expo-sqlite";
import type { Exercise, MuscleGroup } from "@/types";
import {
  getExercisesByFrequency,
  searchExercises,
  createExercise,
  deleteExercise,
  getExerciseUsageCount,
  type ExerciseWithFrequency,
} from "@/db";

export function useExercises() {
  const db = useSQLiteContext();
  const [exercises, setExercises] = useState<ExerciseWithFrequency[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await getExercisesByFrequency(db);
    setExercises(data);
    setLoading(false);
  }, [db]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const search = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        const data = await getExercisesByFrequency(db);
        setExercises(data);
        return;
      }
      const data = await searchExercises(db, query);
      setExercises(data);
    },
    [db]
  );

  const create = useCallback(
    async (name: string, muscleGroup: MuscleGroup, isCable: boolean = false) => {
      const exercise = await createExercise(db, name, muscleGroup, isCable);
      await refresh();
      return exercise;
    },
    [db, refresh]
  );

  const remove = useCallback(
    async (exerciseId: string) => {
      await deleteExercise(db, exerciseId);
      setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
    },
    [db]
  );

  const getUsageCount = useCallback(
    async (exerciseId: string) => {
      return getExerciseUsageCount(db, exerciseId);
    },
    [db]
  );

  return { exercises, loading, refresh, search, create, remove, getUsageCount };
}
