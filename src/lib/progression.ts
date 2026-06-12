import type { Exercise, ExerciseStats, SetResult, Suggestion } from "./types";

const fmtKg = (n: number) => `${n} kg`;

/**
 * Simple progressive overload:
 *  - weighted: hit the rep target on all 3 sets last time → +increment kg, else repeat weight
 *  - reps (bodyweight): hit target on all sets → +1 rep
 *  - timed: hit target hold on all sets → +5 s
 */
export function suggestTarget(exercise: Exercise, stats: ExerciseStats | undefined): Suggestion {
  const last = stats?.lastLog;
  if (!last || last.sets.length === 0) {
    if (exercise.kind === "timed")
      return { text: `First time — try 3 × ${exercise.target} s per side`, seconds: exercise.target };
    if (exercise.kind === "reps")
      return { text: `First time — try 3 × ${exercise.target} reps`, reps: exercise.target };
    return { text: `First time — pick a weight you can do for 3 × ${exercise.target}`, reps: exercise.target };
  }

  const sets = last.sets;

  if (exercise.kind === "timed") {
    const minS = Math.min(...sets.map((s) => s.seconds ?? 0));
    const maxS = Math.max(...sets.map((s) => s.seconds ?? 0));
    const next = minS >= exercise.target ? maxS + 5 : maxS;
    return { text: `3 × ${next} s per side`, seconds: next };
  }

  if (exercise.kind === "reps") {
    const minR = Math.min(...sets.map((s) => s.reps ?? 0));
    const maxR = Math.max(...sets.map((s) => s.reps ?? 0));
    const next = minR >= exercise.target ? maxR + 1 : maxR;
    return { text: `3 × ${next} reps`, reps: next };
  }

  const lastWeight = Math.max(...sets.map((s) => s.weight ?? 0));
  const minReps = Math.min(...sets.map((s) => s.reps ?? 0));
  const allAtTopWeight = sets.every((s) => (s.weight ?? 0) >= lastWeight);
  const hitTarget = minReps >= exercise.target && allAtTopWeight;
  const weight = hitTarget ? lastWeight + exercise.increment : lastWeight;
  return {
    text: `3 × ${exercise.target} @ ${fmtKg(weight)}${hitTarget ? " (weight up!)" : ""}`,
    weight,
    reps: exercise.target,
  };
}

export function formatSet(exercise: Exercise, s: SetResult): string {
  if (exercise.kind === "timed") return `${s.seconds ?? 0} s`;
  if (exercise.kind === "reps") return `${s.reps ?? 0} reps`;
  return `${s.weight ?? 0} kg × ${s.reps ?? 0}`;
}

export function formatLast(exercise: Exercise, stats: ExerciseStats | undefined): string | null {
  const last = stats?.lastLog;
  if (!last || last.sets.length === 0) return null;
  return last.sets.map((s) => formatSet(exercise, s)).join("  ·  ");
}
