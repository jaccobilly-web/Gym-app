import { useEffect, useState } from "react";

const REST_SECONDS = 90;

export default function RestTimer() {
  const [endTime, setEndTime] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (endTime === null) return;
    setRemaining(Math.max(0, Math.round((endTime - Date.now()) / 1000)));
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        clearInterval(id);
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      }
    }, 250);
    return () => clearInterval(id);
  }, [endTime]);

  if (endTime === null) {
    return (
      <button type="button" className="btn ghost timer" onClick={() => setEndTime(Date.now() + REST_SECONDS * 1000)}>
        ⏱ Rest {REST_SECONDS}s
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`btn timer ${remaining === 0 ? "timer-done" : "timer-running"}`}
      onClick={() => setEndTime(null)}
    >
      {remaining === 0 ? "✅ Go!" : `⏱ ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}
    </button>
  );
}
