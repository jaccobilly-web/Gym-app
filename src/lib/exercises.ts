import type { Exercise, WorkoutType } from "./types";

export const EXERCISES: Exercise[] = [
  // Lower body
  { id: "squat", name: "Squat", region: "lower", group: "quads", family: "quads", kind: "weighted", target: 8, increment: 2.5 },
  { id: "hamstring-curl", name: "Hamstring curl", region: "lower", group: "hamstrings", family: "hamstrings", kind: "weighted", target: 10, increment: 2.5 },
  { id: "calf-raise", name: "Calf raise", region: "lower", group: "calves", family: "calves", kind: "weighted", target: 12, increment: 2.5 },
  { id: "hip-thrust", name: "Hip thrust", region: "lower", group: "glutes", family: "hips", kind: "weighted", target: 10, increment: 2.5 },
  { id: "box-jump", name: "Box jump", region: "lower", group: "quads", family: "quads", kind: "reps", target: 8, increment: 0 },
  { id: "hip-adductor", name: "Hip adductor", region: "lower", group: "adductors", family: "hips", kind: "weighted", target: 12, increment: 2.5 },
  { id: "hip-abductor", name: "Hip abductor", region: "lower", group: "abductors", family: "hips", kind: "weighted", target: 12, increment: 2.5 },
  // Core
  { id: "weighted-situp", name: "Weighted sit ups", region: "core", group: "abs", family: "core", kind: "weighted", target: 12, increment: 1.25 },
  { id: "side-plank", name: "Side planks", region: "core", group: "obliques", family: "core", kind: "timed", target: 30, increment: 0 },
  // Upper body
  { id: "bench-press", name: "Bench press", region: "upper", group: "chest", family: "push", kind: "weighted", target: 8, increment: 2.5 },
  { id: "shoulder-press", name: "Shoulder press", region: "upper", group: "shoulders", family: "push", kind: "weighted", target: 8, increment: 2.5 },
  { id: "bicep-curl", name: "Bicep curl", region: "upper", group: "biceps", family: "pull", kind: "weighted", target: 10, increment: 1.25 },
  { id: "tri-extension", name: "Tri extension", region: "upper", group: "triceps", family: "push", kind: "weighted", target: 10, increment: 1.25 },
  { id: "seated-row", name: "Seated row", region: "upper", group: "back", family: "pull", kind: "weighted", target: 10, increment: 2.5 },
  { id: "lat-pulldown", name: "Lateral pulldown", region: "upper", group: "back", family: "pull", kind: "weighted", target: 10, increment: 2.5 },
];

export const exerciseById = (id: string): Exercise | undefined =>
  EXERCISES.find((e) => e.id === id);

export function poolFor(type: WorkoutType): Exercise[] {
  if (type === "lower") return EXERCISES.filter((e) => e.region === "lower" || e.region === "core");
  if (type === "upper") return EXERCISES.filter((e) => e.region === "upper");
  return EXERCISES;
}
