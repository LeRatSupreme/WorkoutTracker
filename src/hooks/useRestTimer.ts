import { useState, useRef, useCallback, useEffect } from "react";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";

interface UseRestTimerReturn {
  seconds: number;
  isRunning: boolean;
  start: (duration: number) => void;
  stop: () => void;
  skip: () => void;
}

export function useRestTimer(): UseRestTimerReturn {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifIdRef = useRef<string | null>(null);
  const endTimeRef = useRef<number>(0);

  const cancelNotification = useCallback(async () => {
    if (notifIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(notifIdRef.current);
      notifIdRef.current = null;
    }
  }, []);

  const scheduleNotification = useCallback(async (durationSeconds: number) => {
    await cancelNotification();
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Repos terminé 💪",
        body: "C'est reparti !",
        sound: "default",
        interruptionLevel: "timeSensitive",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: durationSeconds,
      },
    });
    notifIdRef.current = id;
  }, [cancelNotification]);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    cleanup();
    cancelNotification();
    setIsRunning(false);
    setSeconds(0);
  }, [cleanup, cancelNotification]);

  const start = useCallback(
    (duration: number) => {
      cleanup();
      endTimeRef.current = Date.now() + duration * 1000;
      setSeconds(duration);
      setIsRunning(true);
      scheduleNotification(duration);

      intervalRef.current = setInterval(() => {
        const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
        if (remaining <= 0) {
          cleanup();
          setIsRunning(false);
          setSeconds(0);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          setSeconds(remaining);
        }
      }, 1000);
    },
    [cleanup, scheduleNotification]
  );

  const skip = useCallback(() => {
    stop();
  }, [stop]);

  useEffect(() => {
    return () => {
      cleanup();
      cancelNotification();
    };
  }, [cleanup, cancelNotification]);

  return { seconds, isRunning, start, stop, skip };
}
