import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchAllLogs } from "../lib/api";
import { EXERCISES } from "../lib/exercises";
import type { Exercise, ExerciseLog } from "../lib/types";

interface Props {
  extras: Exercise[];
  onBack: () => void;
}

interface Point {
  date: string;
  ts: number;
  weight?: number;
  reps?: number;
  seconds?: number;
}

function seriesFor(exercise: Exercise, logs: ExerciseLog[]): Point[] {
  return logs
    .filter((l) => l.exercise_id === exercise.id)
    .map((l) => {
      const ts = new Date(l.created_at).getTime();
      const date = new Date(l.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short" });
      if (exercise.kind === "timed")
        return { date, ts, seconds: Math.max(...l.sets.map((s) => s.seconds ?? 0)) };
      if (exercise.kind === "reps")
        return { date, ts, reps: Math.max(...l.sets.map((s) => s.reps ?? 0)) };
      const weight = Math.max(...l.sets.map((s) => s.weight ?? 0));
      const reps = Math.max(...l.sets.filter((s) => (s.weight ?? 0) === weight).map((s) => s.reps ?? 0));
      return { date, ts, weight, reps };
    })
    .sort((a, b) => a.ts - b.ts);
}

export default function Progress({ extras, onBack }: Props) {
  const allExercises = useMemo(() => [...EXERCISES, ...extras], [extras]);
  const [logs, setLogs] = useState<ExerciseLog[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState(EXERCISES[0].id);

  useEffect(() => {
    fetchAllLogs()
      .then(setLogs)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const exercise = allExercises.find((e) => e.id === selectedId) ?? allExercises[0];
  const points = useMemo(() => (logs ? seriesFor(exercise, logs) : []), [logs, exercise]);

  const primaryKey = exercise.kind === "timed" ? "seconds" : exercise.kind === "reps" ? "reps" : "weight";
  const primaryLabel = exercise.kind === "timed" ? "Max hold (s)" : exercise.kind === "reps" ? "Max reps" : "Top weight (kg)";

  return (
    <div className="screen">
      <header className="topbar">
        <button className="btn ghost small" onClick={onBack}>← Back</button>
        <h1>📈 Progress</h1>
      </header>

      <select className="exercise-select" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
        {allExercises.map((e) => (
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>

      {error && <p className="error">{error}</p>}
      {!logs && !error && <p>Loading…</p>}

      {logs && points.length === 0 && (
        <div className="card"><p>No sessions logged for {exercise.name} yet.</p></div>
      )}

      {points.length > 0 && (
        <>
          <div className="card chart-card">
            <h3>{primaryLabel}</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3142" />
                <XAxis dataKey="date" stroke="#8b93a7" fontSize={12} />
                <YAxis stroke="#8b93a7" fontSize={12} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ background: "#1a2030", border: "1px solid #2a3142", borderRadius: 8 }}
                  labelStyle={{ color: "#e6e9f0" }}
                />
                <Line type="monotone" dataKey={primaryKey} stroke="#5b8cff" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {exercise.kind === "weighted" && (
            <div className="card chart-card">
              <h3>Reps at top weight</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3142" />
                  <XAxis dataKey="date" stroke="#8b93a7" fontSize={12} />
                  <YAxis stroke="#8b93a7" fontSize={12} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ background: "#1a2030", border: "1px solid #2a3142", borderRadius: 8 }}
                    labelStyle={{ color: "#e6e9f0" }}
                  />
                  <Line type="monotone" dataKey="reps" stroke="#4ecf8e" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
