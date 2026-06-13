import { useEffect, useState } from "react";
import { deleteWorkout, fetchAllLogs, fetchWorkouts } from "../lib/api";
import { errMsg } from "../lib/utils";
import { exerciseById } from "../lib/exercises";
import { formatSet } from "../lib/progression";
import type { Exercise, ExerciseLog, Workout } from "../lib/types";

interface Props {
  extras: Exercise[];
  onBack: () => void;
}

const TYPE_EMOJI: Record<string, string> = { lower: "🦵", upper: "💪", full: "🔥" };

export default function History({ extras, onBack }: Props) {
  const [workouts, setWorkouts] = useState<Workout[] | null>(null);
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchWorkouts(), fetchAllLogs()])
      .then(([w, l]) => {
        // hide workouts where nothing was logged
        const logged = new Set(l.map((x) => x.workout_id));
        setWorkouts(w.filter((x) => logged.has(x.id)));
        setLogs(l);
      })
      .catch((e) => setError(errMsg(e)));
  }, []);

  async function remove(id: string) {
    if (!window.confirm("Delete this workout and all its logged sets?")) return;
    try {
      await deleteWorkout(id);
      setWorkouts((w) => (w ? w.filter((x) => x.id !== id) : w));
      setLogs((l) => l.filter((x) => x.workout_id !== id));
    } catch (e) {
      setError(errMsg(e));
    }
  }

  return (
    <div className="screen">
      <header className="topbar">
        <button className="btn ghost small" onClick={onBack}>← Back</button>
        <h1>📋 History</h1>
      </header>

      {error && <p className="error">{error}</p>}
      {!workouts && !error && <p>Loading…</p>}
      {workouts && workouts.length === 0 && (
        <div className="card"><p>No workouts yet — go lift something!</p></div>
      )}

      {workouts?.map((w) => {
        const wLogs = logs.filter((l) => l.workout_id === w.id).sort((a, b) => a.position - b.position);
        const open = openId === w.id;
        return (
          <div className="card workout-card" key={w.id}>
            <button className="workout-header" onClick={() => setOpenId(open ? null : w.id)}>
              <span>
                {TYPE_EMOJI[w.type]} <strong>{w.type === "full" ? "Full body" : w.type[0].toUpperCase() + w.type.slice(1)}</strong>
              </span>
              <span className="muted">
                {new Date(w.started_at).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                {" · "}{wLogs.length} exercises {open ? "▾" : "▸"}
              </span>
            </button>
            {open && (
              <ul className="log-list">
                {wLogs.map((l) => {
                  const ex = exerciseById(l.exercise_id, extras);
                  return (
                    <li key={l.id}>
                      <span className="log-name">{ex?.name ?? l.exercise_id}</span>
                      <span className="muted">
                        {ex ? l.sets.map((s) => formatSet(ex, s)).join(" · ") : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            {open && (
              <div className="workout-footer">
                <button className="btn ghost small danger" onClick={() => remove(w.id)}>
                  🗑 Delete workout
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
