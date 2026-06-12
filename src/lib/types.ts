export type Region = "lower" | "core" | "upper";
export type WorkoutType = "lower" | "upper" | "full";

/** weighted: weight + reps; reps: bodyweight reps only; timed: seconds held */
export type ExerciseKind = "weighted" | "reps" | "timed";

export interface Exercise {
  id: string;
  name: string;
  region: Region;
  /** exact muscle group — never repeated twice in a row */
  group: string;
  /** broader movement family (push/pull/quads/hips/…) — avoided twice in a row when possible */
  family: string;
  kind: ExerciseKind;
  /** rep target per set (or seconds for timed) used by the progression rule */
  target: number;
  /** kg added when progression criteria are met */
  increment: number;
}

export interface SetResult {
  weight?: number;
  reps?: number;
  seconds?: number;
}

export interface ExerciseLog {
  id: string;
  workout_id: string;
  exercise_id: string;
  position: number;
  sets: SetResult[];
  created_at: string;
}

export interface Workout {
  id: string;
  type: WorkoutType;
  started_at: string;
  finished_at: string | null;
}

export interface Suggestion {
  text: string;
  weight?: number;
  reps?: number;
  seconds?: number;
}

/** Per-exercise history summary used for balancing & suggestions */
export interface ExerciseStats {
  lastLog: ExerciseLog | null;
  timesDone: number;
  /** best (heaviest weight, then most reps / longest hold) ever achieved */
  best: SetResult | null;
}
