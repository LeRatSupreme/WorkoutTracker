import { useState, useEffect } from "react";
import { useSQLiteContext } from "expo-sqlite";
import type { LastPerformanceSet } from "@/types";
import { getLastPerformance } from "@/db";

export function useLastPerformance(exerciseId: string | null) {
  const db = useSQLiteContext();
  const [sets, setSets] = useState<LastPerformanceSet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!exerciseId) {
      setSets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    getLastPerformance(db, exerciseId)
      .then((data) => {
        setSets(data);
        setLoading(false);
      })
      .catch((e) => {
        console.log("[useLastPerformance] FAILED:", e);
        setLoading(false);
      });
  }, [db, exerciseId]);

  return { sets, loading };
}
