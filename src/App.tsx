import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { isConfigured, supabase } from "./lib/supabase";
import type { Exercise, WorkoutType } from "./lib/types";
import { fetchCustomExercises } from "./lib/api";
import AuthScreen from "./components/AuthScreen";
import Home from "./components/Home";
import WorkoutSession from "./components/WorkoutSession";
import Progress from "./components/Progress";
import History from "./components/History";
import CreateExercise from "./components/CreateExercise";

type View =
  | { name: "home" }
  | { name: "session"; type: WorkoutType }
  | { name: "progress" }
  | { name: "history" }
  | { name: "create-exercise" };

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [view, setView] = useState<View>({ name: "home" });
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    if (!isConfigured) {
      setAuthReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load custom exercises once the user is signed in
  useEffect(() => {
    if (!session) return;
    fetchCustomExercises()
      .then(setCustomExercises)
      .catch(() => {}); // non-fatal
  }, [session]);

  if (!isConfigured) {
    return (
      <div className="screen center">
        <div className="card">
          <h1>Setup needed</h1>
          <p>
            Supabase isn't configured. Set <code>VITE_SUPABASE_URL</code> and{" "}
            <code>VITE_SUPABASE_ANON_KEY</code> (in Vercel project settings or a local{" "}
            <code>.env</code> file), then redeploy. See the README for full setup steps.
          </p>
        </div>
      </div>
    );
  }

  if (!authReady) return <div className="screen center">Loading…</div>;
  if (!session) return <AuthScreen />;

  switch (view.name) {
    case "home":
      return (
        <Home
          onStart={(type) => setView({ name: "session", type })}
          onProgress={() => setView({ name: "progress" })}
          onHistory={() => setView({ name: "history" })}
          onCreateExercise={() => setView({ name: "create-exercise" })}
        />
      );
    case "session":
      return (
        <WorkoutSession
          type={view.type}
          extras={customExercises}
          onExit={() => setView({ name: "home" })}
        />
      );
    case "progress":
      return (
        <Progress
          extras={customExercises}
          onBack={() => setView({ name: "home" })}
        />
      );
    case "history":
      return (
        <History
          extras={customExercises}
          onBack={() => setView({ name: "home" })}
        />
      );
    case "create-exercise":
      return (
        <CreateExercise
          onBack={() => setView({ name: "home" })}
          onCreate={(ex) => {
            setCustomExercises((prev) => [...prev, ex]);
            setView({ name: "home" });
          }}
        />
      );
  }
}
