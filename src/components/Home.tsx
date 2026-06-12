import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { fetchAllLogs, fetchWorkouts } from "../lib/api";
import type { WorkoutType } from "../lib/types";

interface Props {
  onStart: (type: WorkoutType) => void;
  onProgress: () => void;
  onHistory: () => void;
}

const TYPE_EMOJI: Record<string, string> = { lower: "🦵", upper: "💪", full: "🔥" };

interface Day {
  key: string;
  label: number;
  weekday: string;
  isToday: boolean;
  emojis: string[];
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default function Home({ onStart, onProgress, onHistory }: Props) {
  const [days, setDays] = useState<Day[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchWorkouts(), fetchAllLogs()])
      .then(([workouts, logs]) => {
        if (cancelled) return;
        const logged = new Set(logs.map((l) => l.workout_id));
        const byDay = new Map<string, string[]>();
        for (const w of workouts) {
          if (!logged.has(w.id)) continue;
          const key = dayKey(new Date(w.started_at));
          byDay.set(key, [...(byDay.get(key) ?? []), TYPE_EMOJI[w.type] ?? "🏋️"]);
        }
        const today = new Date();
        const result: Day[] = [];
        for (let i = 13; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
          result.push({
            key: dayKey(d),
            label: d.getDate(),
            weekday: d.toLocaleDateString(undefined, { weekday: "narrow" }),
            isToday: i === 0,
            emojis: byDay.get(dayKey(d)) ?? [],
          });
        }
        setDays(result);
      })
      .catch(() => {
        if (!cancelled) setDays([]); // calendar is decorative — fail quietly
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="screen">
      <header className="topbar">
        <h1>🏋️ Gym Tracker</h1>
        <button className="btn ghost small" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </header>

      <h2 className="section-title">Last two weeks</h2>
      <div className="card calendar">
        {days === null && <p className="muted">Loading…</p>}
        {days !== null && days.length === 0 && <p className="muted">Couldn't load recent workouts.</p>}
        {days !== null && days.length > 0 && (
          <div className="calendar-grid">
            {days.map((d) => (
              <div className={`calendar-day${d.isToday ? " today" : ""}`} key={d.key}>
                <span className="calendar-weekday">{d.weekday}</span>
                <span className="calendar-date">{d.label}</span>
                <span className="calendar-emoji">{d.emojis.length > 0 ? d.emojis.join("") : "·"}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <h2 className="section-title">Start a workout</h2>
      <div className="start-grid">
        <button className="btn start lower" onClick={() => onStart("lower")}>
          <span className="start-emoji">🦵</span>
          Lower
          <span className="start-sub">legs + core</span>
        </button>
        <button className="btn start upper" onClick={() => onStart("upper")}>
          <span className="start-emoji">💪</span>
          Upper
          <span className="start-sub">chest, back, arms</span>
        </button>
        <button className="btn start full" onClick={() => onStart("full")}>
          <span className="start-emoji">🔥</span>
          Full body
          <span className="start-sub">everything</span>
        </button>
      </div>

      <h2 className="section-title">Review</h2>
      <div className="nav-grid">
        <button className="btn nav" onClick={onProgress}>📈 Progress</button>
        <button className="btn nav" onClick={onHistory}>📋 History</button>
      </div>
    </div>
  );
}
