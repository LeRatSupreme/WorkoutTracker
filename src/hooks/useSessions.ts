import { useState, useEffect, useCallback } from "react";
import { useSQLiteContext } from "expo-sqlite";
import type { SessionWithDetails } from "@/types";
import { getAllSessions, getSessionWithDetails, deleteSession as deleteSessionDb } from "@/db";
import type { SessionWithCount } from "@/db";

export function useSessions() {
  const db = useSQLiteContext();
  const [sessions, setSessions] = useState<SessionWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getAllSessions(db);
    setSessions(data);
    setLoading(false);
  }, [db]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const deleteSession = useCallback(
    async (sessionId: string) => {
      await deleteSessionDb(db, sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    },
    [db]
  );

  return { sessions, loading, refresh, deleteSession };
}

export function useSessionDetails(sessionId: string | null) {
  const db = useSQLiteContext();
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!sessionId) {
      setSession(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await getSessionWithDetails(db, sessionId);
    setSession(data);
    setLoading(false);
  }, [db, sessionId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { session, loading, refresh };
}
