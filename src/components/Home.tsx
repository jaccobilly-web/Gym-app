import { supabase } from "../lib/supabase";
import type { WorkoutType } from "../lib/types";

interface Props {
  onStart: (type: WorkoutType) => void;
  onProgress: () => void;
  onHistory: () => void;
}

export default function Home({ onStart, onProgress, onHistory }: Props) {
  return (
    <div className="screen">
      <header className="topbar">
        <h1>🏋️ Gym Tracker</h1>
        <button className="btn ghost small" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </header>

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
