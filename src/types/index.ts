// Types de séance
export type WorkoutType = "push" | "pull" | "legs" | "custom";

// Statut d'une série
export type SetStatus = "success" | "partial" | "fail";

// Groupes musculaires
export type MuscleGroup = "pecs" | "triceps" | "epaules" | "biceps" | "jambes" | "dos";

// Catalogue d'exercices
export interface Exercise {
  id: string;
  name: string;
  muscle_group: MuscleGroup | null;
  is_cable: boolean;
  created_at: string;
}

// Séance d'entraînement
export interface WorkoutSession {
  id: string;
  type: WorkoutType;
  label: string | null;
  started_at: string;
  finished_at: string | null;
  rating: number | null;
}

// Un exercice dans une séance
export interface ExerciseLog {
  id: string;
  session_id: string;
  exercise_id: string;
  target_reps: number | null;
  order: number;
  comment: string | null;
  weight_factor: number;
}

// Une série dans un exercice
export interface Set {
  id: string;
  exercise_log_id: string;
  weight: number;
  reps: number;
  status: SetStatus;
  order: number;
  muscle_failure: boolean;
}

// Type de séance custom
export interface CustomWorkoutType {
  id: string;
  name: string;
  created_at: string;
}

// Vues enrichies pour l'UI

export interface ExerciseLogWithDetails extends ExerciseLog {
  exercise_name: string;
  sets: Set[];
}

export interface SessionWithDetails extends WorkoutSession {
  logs: ExerciseLogWithDetails[];
}

export interface LastPerformanceSet {
  weight: number;
  reps: number;
  status: SetStatus;
  order: number;
  session_date: string;
}
