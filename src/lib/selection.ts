import type { Exercise, ExerciseStats } from "./types";

/**
 * Pick the next exercise:
 *  - never one already done this session
 *  - never the same muscle group as the previous exercise
 *  - avoid the same movement family as the previous exercise when alternatives exist
 *  - prefer exercises done least recently / least often overall, with a little
 *    randomness so sessions don't become fully deterministic
 */
export function pickNext(
  pool: Exercise[],
  doneThisSession: string[],
  previous: Exercise | null,
  stats: Map<string, ExerciseStats>
): Exercise | null {
  let candidates = pool.filter((e) => !doneThisSession.includes(e.id));
  if (candidates.length === 0) return null;

  if (previous) {
    const diffGroup = candidates.filter((e) => e.group !== previous.group);
    if (diffGroup.length > 0) candidates = diffGroup;
    const diffFamily = candidates.filter((e) => e.family !== previous.family);
    if (diffFamily.length > 0) candidates = diffFamily;
  }

  const now = Date.now();
  const scored = candidates.map((e) => {
    const s = stats.get(e.id);
    const daysSince = s?.lastLog
      ? (now - new Date(s.lastLog.created_at).getTime()) / 86_400_000
      : 365; // never done → top priority
    const timesDone = s?.timesDone ?? 0;
    // staleness dominates, low lifetime count breaks ties, jitter adds variety
    const score = daysSince - timesDone * 0.5 + Math.random() * 2;
    return { e, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].e;
}
