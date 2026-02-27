import { useState, useEffect, useRef, useCallback } from "react";
import {
  getHealthProvider,
  isHealthEnabled,
  getUserMaxHR,
  getCurrentZone,
  type HeartRateSample,
  type HRZoneInfo,
} from "@/lib/health";

interface UseHeartRateReturn {
  currentBPM: number | null;
  avgBPM: number | null;
  maxBPM: number | null;
  zone: HRZoneInfo | null;
  samples: HeartRateSample[];
  isMonitoring: boolean;
  enabled: boolean;
}

/**
 * Hook that polls heart rate data during a session.
 * Reads from HealthKit / Health Connect every 5 seconds.
 */
export function useHeartRate(sessionStartedAt: string | null): UseHeartRateReturn {
  const [currentBPM, setCurrentBPM] = useState<number | null>(null);
  const [avgBPM, setAvgBPM] = useState<number | null>(null);
  const [maxBPM, setMaxBPM] = useState<number | null>(null);
  const [zone, setZone] = useState<HRZoneInfo | null>(null);
  const [samples, setSamples] = useState<HeartRateSample[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [maxHR, setMaxHR] = useState(190);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check if health is enabled
  useEffect(() => {
    isHealthEnabled().then(setEnabled);
    getUserMaxHR().then(setMaxHR);
  }, []);

  const pollHeartRate = useCallback(async () => {
    if (!sessionStartedAt) return;

    const provider = getHealthProvider();
    const now = new Date();
    const sessionStart = new Date(sessionStartedAt);

    // Get HR samples since session started
    const newSamples = await provider.getHeartRateSamples(sessionStart, now);

    if (newSamples.length > 0) {
      setSamples(newSamples);

      // Current = most recent
      const latest = newSamples[newSamples.length - 1];
      setCurrentBPM(latest.bpm);
      setZone(getCurrentZone(latest.bpm, maxHR));

      // Average
      const sum = newSamples.reduce((acc, s) => acc + s.bpm, 0);
      setAvgBPM(Math.round(sum / newSamples.length));

      // Max
      const max = Math.max(...newSamples.map((s) => s.bpm));
      setMaxBPM(max);
    } else {
      // Try getting the latest single reading
      const latest = await provider.getLatestHeartRate();
      if (latest) {
        setCurrentBPM(latest.bpm);
        setZone(getCurrentZone(latest.bpm, maxHR));
      }
    }
  }, [sessionStartedAt, maxHR]);

  // Start/stop polling
  useEffect(() => {
    if (!enabled || !sessionStartedAt) {
      setIsMonitoring(false);
      return;
    }

    setIsMonitoring(true);

    // Initial poll
    pollHeartRate();

    // Poll every 5 seconds
    intervalRef.current = setInterval(pollHeartRate, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsMonitoring(false);
    };
  }, [enabled, sessionStartedAt, pollHeartRate]);

  return { currentBPM, avgBPM, maxBPM, zone, samples, isMonitoring, enabled };
}
