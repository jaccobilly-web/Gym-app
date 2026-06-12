import { useEffect, useMemo, useState } from "react";
import { buildStats, createWorkout, deleteWorkout, fetchAllLogs, finishWorkout, logExercise } from "../lib/api";
import { poolFor } from "../lib/exercises";
import { pickNext } from "../lib/selection";
import { formatLast, formatSet, suggestTarget } from "../lib/progression";
import type { Exercise, ExerciseStats, SetResult, Workout, WorkoutType } from "../lib/types";
import RestTimer from "./RestTimer";

interface Props {
  type: WorkoutType;
  onExit: () => void;
}

interface SetInput {
  weight: string;
  reps: string;
  seconds: string;
}

const TYPE_LABEL: Record<WorkoutType, string> = {
  lower: "Lower (legs + core)",
  upper: "Upper body",
  full: "Full body",
};

function inputsFromSuggestion(exercise: Exercise, stats: Map<string, ExerciseStats>): SetInput[] {
  const s = suggestTarget(exercise, stats.get(exercise.id));
  return Array.from({ length: 3 }, () => ({
    weight: s.weight != null ? String(s.weight) : "",
    reps: s.reps != null ? String(s.reps) : "",
    seconds: s.seconds != null ? String(s.seconds) : "",
  }));
}

export default function WorkoutSession({ type, onExit }: Props) {
  const pool = useMemo(() => poolFor(type), [type]);
  const [stats, setStats] = useState<Map<string, ExerciseStats> | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [current, setCurrent] = useState<Exercise | null>(null);
  const [inputs, setInputs] = useState<SetInput[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [logs, w] = await Promise.all([fetchAllLogs(), createWorkout(type)]);
        if (cancelled) return;
        const st = buildStats(logs);
        setStats(st);
        setWorkout(w);
        const first = pickNext(pool, [], null, st);
        setCurrent(first);
        if (first) setInputs(inputsFromSuggestion(first, st));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function parseSets(exercise: Exercise): SetResult[] | null {
    const sets: SetResult[] = [];
    for (const i of inputs) {
      if (exercise.kind === "timed") {
        const seconds = Number(i.seconds);
        if (!i.seconds || !Number.isFinite(seconds) || seconds <= 0) return null;
        sets.push({ seconds });
      } else if (exercise.kind === "reps") {
        const reps = Number(i.reps);
        if (!i.reps || !Number.isFinite(reps) || reps <= 0) return null;
        sets.push({ reps });
      } else {
        const weight = Number(i.weight);
        const reps = Number(i.reps);
        if (!i.weight || !i.reps || !Number.isFinite(weight) || !Number.isFinite(reps) || weight < 0 || reps <= 0)
          return null;
        sets.push({ weight, reps });
      }
    }
    return sets;
  }

  function advance(st: Map<string, ExerciseStats>, doneIds: string[], prev: Exercise) {
    const next = pickNext(pool, doneIds, prev, st);
    setCurrent(next);
    if (next) setInputs(inputsFromSuggestion(next, st));
  }

  async function saveAndNext() {
    if (!current || !workout || !stats) return;
    const sets = parseSets(current);
    if (!sets) {
      setError("Fill in all three sets first.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const log = await logExercise(workout.id, current.id, done.length, sets);
      const st = new Map(stats);
      const prev = st.get(current.id) ?? { lastLog: null, timesDone: 0, best: null };
      st.set(current.id, { ...prev, lastLog: log, timesDone: prev.timesDone + 1 });
      const doneIds = [...done, current.id];
      setStats(st);
      setDone(doneIds);
      advance(st, doneIds, current);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  function skip() {
    if (!current || !stats) return;
    const doneIds = [...done, current.id];
    setDone(doneIds);
    advance(stats, doneIds, current);
  }

  async function stop() {
    if (workout) {
      try {
        // discard the workout entirely if nothing was logged
        if (done.length === 0) await deleteWorkout(workout.id);
        else await finishWorkout(workout.id);
      } catch {
        // non-fatal — leave the workout open rather than blocking exit
      }
    }
    onExit();
  }

  if (error && !current) {
    return (
      <div className="screen center">
        <div className="card">
          <p className="error">{error}</p>
          <button className="btn primary" onClick={onExit}>Back</button>
        </div>
      </div>
    );
  }

  if (!stats || !workout) return <div className="screen center">Loading…</div>;

  if (!current) {
    return (
      <div className="screen center">
        <div className="card">
          <h2>That's everything! 🎉</h2>
          <p>You've been through every exercise in this pool.</p>
          <button className="btn primary" onClick={stop}>Finish workout</button>
        </div>
      </div>
    );
  }

  const exStats = stats.get(current.id);
  const last = formatLast(current, exStats);
  const suggestion = suggestTarget(current, exStats);

  return (
    <div className="screen">
      <header className="topbar">
        <h1>{TYPE_LABEL[type]}</h1>
        <span className="badge">{done.length} done</span>
      </header>

      <div className="card exercise-card">
        <h2 className="exercise-name">{current.name}</h2>
        <p className="muscle">{current.group}</p>

        <div className="info-row">
          <span className="info-label">Last time</span>
          <span>{last ?? "—"}</span>
        </div>
        {exStats?.best && (
          <div className="info-row">
            <span className="info-label">All-time best</span>
            <span>{formatSet(current, exStats.best)}</span>
          </div>
        )}
        <div className="info-row target">
          <span className="info-label">Target</span>
          <span>{suggestion.text}</span>
        </div>

        <div className="sets">
          {inputs.map((set, i) => (
            <div className="set-row" key={i}>
              <span className="set-num">Set {i + 1}</span>
              {current.kind === "weighted" && (
                <>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.25"
                    min="0"
                    placeholder="kg"
                    value={set.weight}
                    onChange={(e) =>
                      setInputs(inputs.map((s, j) => (j === i ? { ...s, weight: e.target.value } : s)))
                    }
                  />
                  <span className="unit">kg ×</span>
                </>
              )}
              {current.kind !== "timed" && (
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="reps"
                  value={set.reps}
                  onChange={(e) =>
                    setInputs(inputs.map((s, j) => (j === i ? { ...s, reps: e.target.value } : s)))
                  }
                />
              )}
              {current.kind === "timed" && (
                <>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="seconds"
                    value={set.seconds}
                    onChange={(e) =>
                      setInputs(inputs.map((s, j) => (j === i ? { ...s, seconds: e.target.value } : s)))
                    }
                  />
                  <span className="unit">s / side</span>
                </>
              )}
            </div>
          ))}
        </div>

        <RestTimer />

        {error && <p className="error">{error}</p>}

        <div className="actions">
          <button className="btn primary" onClick={saveAndNext} disabled={saving}>
            {saving ? "Saving…" : "Save → next"}
          </button>
          <button className="btn ghost" onClick={skip} disabled={saving}>
            Skip
          </button>
        </div>
      </div>

      <button className="btn stop" onClick={stop}>
        ⏹ Stop workout
      </button>
    </div>
  );
}
