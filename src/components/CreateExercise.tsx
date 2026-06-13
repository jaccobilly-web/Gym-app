import { type FormEvent, useState } from "react";
import { createCustomExercise } from "../lib/api";
import type { Exercise, ExerciseKind, Region } from "../lib/types";
import { errMsg } from "../lib/utils";

interface Props {
  onBack: () => void;
  onCreate: (exercise: Exercise) => void;
}

const MUSCLE_GROUPS: Record<Region, { label: string; value: string }[]> = {
  lower: [
    { label: "Quads", value: "quads" },
    { label: "Hamstrings", value: "hamstrings" },
    { label: "Glutes", value: "glutes" },
    { label: "Calves", value: "calves" },
    { label: "Adductors", value: "adductors" },
    { label: "Abductors", value: "abductors" },
    { label: "Other", value: "other-lower" },
  ],
  core: [
    { label: "Abs", value: "abs" },
    { label: "Obliques", value: "obliques" },
    { label: "Lower back", value: "lower-back" },
    { label: "Other", value: "other-core" },
  ],
  upper: [
    { label: "Chest", value: "chest" },
    { label: "Back", value: "back" },
    { label: "Shoulders", value: "shoulders" },
    { label: "Biceps", value: "biceps" },
    { label: "Triceps", value: "triceps" },
    { label: "Forearms", value: "forearms" },
    { label: "Other", value: "other-upper" },
  ],
};

/** Broad movement family derived from group — used by the rotation algorithm */
function familyFor(region: Region, group: string): string {
  if (region === "upper") {
    if (["chest", "shoulders", "triceps"].includes(group)) return "push";
    if (["back", "biceps", "forearms"].includes(group)) return "pull";
  }
  if (region === "lower") {
    if (["glutes", "adductors", "abductors"].includes(group)) return "hips";
    return group; // quads, hamstrings, calves each get their own family
  }
  return "core";
}

export default function CreateExercise({ onBack, onCreate }: Props) {
  const [name, setName] = useState("");
  const [region, setRegion] = useState<Region>("upper");
  const [group, setGroup] = useState("chest");
  const [kind, setKind] = useState<ExerciseKind>("weighted");
  const [target, setTarget] = useState("10");
  const [increment, setIncrement] = useState("2.5");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset group when region changes
  function handleRegion(r: Region) {
    setRegion(r);
    setGroup(MUSCLE_GROUPS[r][0].value);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required."); return; }
    const targetNum = Number(target);
    const incNum = Number(increment);
    if (!Number.isFinite(targetNum) || targetNum <= 0) { setError("Target must be a positive number."); return; }
    if (!Number.isFinite(incNum) || incNum < 0) { setError("Increment must be 0 or more."); return; }

    setSaving(true);
    setError(null);
    try {
      const ex = await createCustomExercise({
        name: name.trim(),
        region,
        group,
        family: familyFor(region, group),
        kind,
        target: targetNum,
        increment: kind === "weighted" ? incNum : 0,
      });
      onCreate(ex);
    } catch (e) {
      setError(errMsg(e));
      setSaving(false);
    }
  }

  return (
    <div className="screen">
      <header className="topbar">
        <button className="btn ghost small" onClick={onBack}>← Back</button>
        <h1>New exercise</h1>
      </header>

      <form className="card create-form" onSubmit={submit}>
        <label className="field">
          <span>Name</span>
          <input
            type="text"
            placeholder="e.g. Romanian deadlift"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </label>

        <label className="field">
          <span>Region</span>
          <select value={region} onChange={(e) => handleRegion(e.target.value as Region)}>
            <option value="upper">Upper body</option>
            <option value="lower">Lower body</option>
            <option value="core">Core</option>
          </select>
        </label>

        <label className="field">
          <span>Muscle group</span>
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            {MUSCLE_GROUPS[region].map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Type</span>
          <select value={kind} onChange={(e) => setKind(e.target.value as ExerciseKind)}>
            <option value="weighted">Weighted (kg + reps)</option>
            <option value="reps">Bodyweight reps</option>
            <option value="timed">Timed hold (seconds)</option>
          </select>
        </label>

        <label className="field">
          <span>{kind === "timed" ? "Target hold (seconds)" : "Target reps per set"}</span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </label>

        {kind === "weighted" && (
          <label className="field">
            <span>Weight increment when target is hit (kg)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.25"
              min="0"
              value={increment}
              onChange={(e) => setIncrement(e.target.value)}
            />
          </label>
        )}

        {error && <p className="error">{error}</p>}

        <button className="btn primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Create exercise"}
        </button>
      </form>
    </div>
  );
}
