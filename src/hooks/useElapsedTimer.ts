import { useState, useEffect, useRef } from "react";
import { formatTimer } from "@/lib/utils";

export function useElapsedTimer(startedAt: string | null): string {
  const [elapsed, setElapsed] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!startedAt) {
      setElapsed("");
      return;
    }

    const update = () => {
      const diffMs = Date.now() - new Date(startedAt).getTime();
      const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));

      if (totalSeconds >= 3600) {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        setElapsed(`${h}h${m.toString().padStart(2, "0")}`);
      } else {
        setElapsed(formatTimer(totalSeconds));
      }
    };

    update();
    intervalRef.current = setInterval(update, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startedAt]);

  return elapsed;
}
