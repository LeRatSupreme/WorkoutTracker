import { useState, useEffect, useCallback } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useTranslation } from "react-i18next";

export interface WeekDay {
  label: string;
  date: string;
  hasSession: boolean;
  isToday: boolean;
}

const DAY_KEYS = ["days.mon", "days.tue", "days.wed", "days.thu", "days.fri", "days.sat", "days.sun"];

function toLocalDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function useWeekActivity() {
  const db = useSQLiteContext();
  const { t } = useTranslation();
  const [days, setDays] = useState<WeekDay[]>([]);
  const [sessionCount, setSessionCount] = useState(0);
  const [daysSinceLastSession, setDaysSinceLastSession] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const today = new Date();
    const monday = getMonday(today);
    const todayStr = toLocalDateStr(today);

    // Séances terminées de la semaine
    const weekStart = monday.toISOString();
    const sessions = await db.getAllAsync<{ started_at: string }>(
      `SELECT started_at FROM workout_sessions
       WHERE finished_at IS NOT NULL AND started_at >= ?
       ORDER BY started_at ASC`,
      [weekStart]
    );

    const sessionDates = new Set(
      sessions.map((s) => toLocalDateStr(new Date(s.started_at)))
    );

    const weekDays: WeekDay[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      const dateStr = toLocalDateStr(d);
      weekDays.push({
        label: t(DAY_KEYS[i]),
        date: dateStr,
        hasSession: sessionDates.has(dateStr),
        isToday: dateStr === todayStr,
      });
    }

    setDays(weekDays);
    setSessionCount(sessions.length);

    // Jours depuis dernière séance
    const last = await db.getFirstAsync<{ started_at: string }>(
      `SELECT started_at FROM workout_sessions
       WHERE finished_at IS NOT NULL
       ORDER BY started_at DESC LIMIT 1`
    );

    if (last) {
      const lastDate = new Date(last.started_at);
      const diffMs = today.getTime() - lastDate.getTime();
      setDaysSinceLastSession(Math.floor(diffMs / 86400000));
    } else {
      setDaysSinceLastSession(null);
    }

    setLoading(false);
  }, [db, t]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { days, sessionCount, daysSinceLastSession, loading, refresh };
}
