import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { isConfigured, supabase } from "./lib/supabase";
import type { WorkoutType } from "./lib/types";
import AuthScreen from "./components/AuthScreen";
import Home from "./components/Home";
import WorkoutSession from "./components/WorkoutSession";
import Progress from "./components/Progress";
import History from "./components/History";

type View =
  | { name: "home" }
  | { name: "session"; type: WorkoutType }
  | { name: "progress" }
  | { name: "history" };

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [view, setView] = useState<View>({ name: "home" });

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
        />
      );
    case "session":
      return <WorkoutSession type={view.type} onExit={() => setView({ name: "home" })} />;
    case "progress":
      return <Progress onBack={() => setView({ name: "home" })} />;
    case "history":
      return <History onBack={() => setView({ name: "home" })} />;
  }
}
