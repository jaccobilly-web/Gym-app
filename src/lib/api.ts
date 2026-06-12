import { supabase } from "./supabase";
import type { ExerciseLog, ExerciseStats, SetResult, Workout, WorkoutType } from "./types";

export async function fetchAllLogs(): Promise<ExerciseLog[]> {
  const { data, error } = await supabase
    .from("exercise_logs")
    .select("id, workout_id, exercise_id, position, sets, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ExerciseLog[];
}

export async function fetchWorkouts(): Promise<Workout[]> {
  const { data, error } = await supabase
    .from("workouts")
    .select("id, type, started_at, finished_at")
    .order("started_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Workout[];
}

export async function createWorkout(type: WorkoutType): Promise<Workout> {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("workouts")
    .insert({ type, user_id: userData.user?.id })
    .select()
    .single();
  if (error) throw error;
  return data as Workout;
}

export async function finishWorkout(id: string): Promise<void> {
  const { error } = await supabase
    .from("workouts")
    .update({ finished_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteWorkout(id: string): Promise<void> {
  const { error } = await supabase.from("workouts").delete().eq("id", id);
  if (error) throw error;
}

export async function logExercise(
  workoutId: string,
  exerciseId: string,
  position: number,
  sets: SetResult[]
): Promise<ExerciseLog> {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("exercise_logs")
    .insert({
      workout_id: workoutId,
      exercise_id: exerciseId,
      position,
      sets,
      user_id: userData.user?.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ExerciseLog;
}

function betterSet(a: SetResult | null, b: SetResult): SetResult {
  if (!a) return b;
  const wa = a.weight ?? 0;
  const wb = b.weight ?? 0;
  if (wb !== wa) return wb > wa ? b : a;
  const ra = (a.reps ?? 0) + (a.seconds ?? 0);
  const rb = (b.reps ?? 0) + (b.seconds ?? 0);
  return rb > ra ? b : a;
}

/** Build per-exercise stats (last log, lifetime count, all-time best) from log history. */
export function buildStats(logs: ExerciseLog[]): Map<string, ExerciseStats> {
  const map = new Map<string, ExerciseStats>();
  for (const log of logs) {
    const s = map.get(log.exercise_id) ?? { lastLog: null, timesDone: 0, best: null };
    s.timesDone += 1;
    // logs arrive in ascending created_at order, so the latest one wins
    s.lastLog = log;
    for (const set of log.sets) s.best = betterSet(s.best, set);
    map.set(log.exercise_id, s);
  }
  return map;
}
