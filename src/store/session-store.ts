import { create } from "zustand";
import type { WorkoutType, SetStatus, Exercise, SessionWithDetails } from "@/types";

export interface ActiveSet {
  id: string;
  weight: number;
  reps: number;
  status: SetStatus;
  order: number;
  muscle_failure: boolean;
}

export interface ActiveExercise {
  logId: string;
  exercise: Exercise;
  sets: ActiveSet[];
  order: number;
  comment: string | null;
  weight_factor: number;
}

interface SessionState {
  // Séance en cours
  sessionId: string | null;
  sessionType: WorkoutType | null;
  sessionLabel: string | null;
  startedAt: string | null;

  // Exercices de la séance
  exercises: ActiveExercise[];
  currentExerciseIndex: number;

  // Actions
  startSession: (id: string, type: WorkoutType, startedAt: string, label?: string | null) => void;
  restoreSession: (session: SessionWithDetails) => void;
  addExercise: (logId: string, exercise: Exercise, order: number, weightFactor?: number) => void;
  removeExercise: (logId: string) => void;
  setCurrentExerciseIndex: (index: number) => void;
  addSetToExercise: (logId: string, set: ActiveSet) => void;
  removeSetFromExercise: (logId: string, setId: string) => void;
  setComment: (logId: string, comment: string | null) => void;
  setWeightFactor: (logId: string, factor: number) => void;
  endSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: null,
  sessionType: null,
  sessionLabel: null,
  startedAt: null,
  exercises: [],
  currentExerciseIndex: 0,

  startSession: (id, type, startedAt, label) =>
    set({
      sessionId: id,
      sessionType: type,
      sessionLabel: label ?? null,
      startedAt,
      exercises: [],
      currentExerciseIndex: 0,
    }),

  restoreSession: (session) =>
    set({
      sessionId: session.id,
      sessionType: session.type,
      sessionLabel: session.label,
      startedAt: session.started_at,
      exercises: session.logs.map((log: any) => ({
        logId: log.id,
        exercise: {
          id: log.exercise_id,
          name: log.exercise_name,
          muscle_group: null,
          is_cable: !!log.is_cable,
          created_at: "",
        },
        sets: log.sets.map((s: any) => ({
          id: s.id,
          weight: s.weight,
          reps: s.reps,
          status: s.status,
          order: s.order,
          muscle_failure: s.muscle_failure,
        })),
        order: log.order,
        comment: log.comment,
        weight_factor: log.weight_factor ?? 1.0,
      })),
      currentExerciseIndex: 0,
    }),

  addExercise: (logId, exercise, order, weightFactor = 1.0) =>
    set((state) => ({
      exercises: [...state.exercises, { logId, exercise, sets: [], order, comment: null, weight_factor: weightFactor }],
      currentExerciseIndex: state.exercises.length,
    })),

  removeExercise: (logId) =>
    set((state) => {
      const filtered = state.exercises.filter((ex) => ex.logId !== logId);
      const newIndex = Math.min(state.currentExerciseIndex, Math.max(filtered.length - 1, 0));
      return { exercises: filtered, currentExerciseIndex: newIndex };
    }),

  setCurrentExerciseIndex: (index) => set({ currentExerciseIndex: index }),

  addSetToExercise: (logId, newSet) =>
    set((state) => ({
      exercises: state.exercises.map((ex) =>
        ex.logId === logId ? { ...ex, sets: [...ex.sets, newSet] } : ex
      ),
    })),

  removeSetFromExercise: (logId, setId) =>
    set((state) => ({
      exercises: state.exercises.map((ex) =>
        ex.logId === logId
          ? { ...ex, sets: ex.sets.filter((s) => s.id !== setId) }
          : ex
      ),
    })),

  setComment: (logId, comment) =>
    set((state) => ({
      exercises: state.exercises.map((ex) =>
        ex.logId === logId ? { ...ex, comment } : ex
      ),
    })),

  setWeightFactor: (logId, factor) =>
    set((state) => ({
      exercises: state.exercises.map((ex) =>
        ex.logId === logId ? { ...ex, weight_factor: factor } : ex
      ),
    })),

  endSession: () =>
    set({
      sessionId: null,
      sessionType: null,
      sessionLabel: null,
      startedAt: null,
      exercises: [],
      currentExerciseIndex: 0,
    }),
}));
