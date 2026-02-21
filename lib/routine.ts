import { differenceInWeeks, parseISO, startOfWeek } from "date-fns";

// ── Types ──────────────────────────────────────────────────

export type CircuitType = "WARMUP" | "TRAINING" | "COOLDOWN";

export type WeeklySets = Record<string, number>; // {"1": 3, "2": 4, ...}

export type RoutineExercise = {
  id: string;
  exercise_id: string;
  exercise_name: string;
  muscle_group: string;
  reps: string | null;
  notes: string | null;
  youtube_url: string | null;
  sort_order: number;
};

export type RoutineCircuit = {
  id: string;
  label: string;
  circuit_type: CircuitType;
  weekly_sets: WeeklySets;
  sort_order: number;
  notes: string | null;
  exercises: RoutineExercise[];
};

export type RoutineDay = {
  id: string;
  day_number: number;
  label: string | null;
  sort_order: number;
  circuits: RoutineCircuit[];
};

export type ActiveRoutine = {
  id: string;
  group_id: string;
  name: string;
  total_weeks: number;
  start_date: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  days: RoutineDay[];
};

export type Exercise = {
  id: string;
  name: string;
  muscle_group: string;
  youtube_url: string | null;
  is_global: boolean;
};

export type RoutineSession = {
  id: string;
  routine_id: string;
  user_id: string;
  day_id: string;
  session_date: string;
  week_number: number;
  completed_at: string | null;
};

export type ExerciseLog = {
  id: string;
  session_id: string;
  circuit_exercise_id: string;
  set_number: number;
  weight_kg: number | null;
  reps_done: number | null;
  notes: string | null;
};

// ── Builder types (local state) ────────────────────────────

export type BuilderExercise = {
  _key: string; // local key for React
  exercise_id: string;
  exercise_name: string;
  reps: string;
  notes: string;
  youtube_url_override: string;
};

export type BuilderCircuit = {
  _key: string;
  label: string;
  circuit_type: CircuitType;
  weekly_sets: WeeklySets;
  notes: string;
  exercises: BuilderExercise[];
};

export type BuilderDay = {
  _key: string;
  day_number: number;
  label: string;
  circuits: BuilderCircuit[];
};

// ── Helpers ────────────────────────────────────────────────

/**
 * Given a routine start_date and total_weeks, compute which week we're in (1-based).
 * Returns clamped to [1, total_weeks]. Returns 1 if before start.
 */
export function computeCurrentWeek(
  startDate: string,
  totalWeeks: number,
  now: Date = new Date()
): number {
  const start = startOfWeek(parseISO(startDate), { weekStartsOn: 1 });
  const current = startOfWeek(now, { weekStartsOn: 1 });
  const weeksPassed = differenceInWeeks(current, start);
  const week = weeksPassed + 1;
  return Math.max(1, Math.min(week, totalWeeks));
}

/**
 * Get the number of sets for a circuit in a given week.
 */
export function getSetsForWeek(weeklySets: WeeklySets, week: number): number {
  return weeklySets[String(week)] ?? weeklySets["1"] ?? 3;
}

/**
 * Circuit type display config.
 */
export const CIRCUIT_TYPE_CONFIG: Record<
  CircuitType,
  { label: string; color: string; bg: string }
> = {
  WARMUP: { label: "Warmup", color: "text-amber-400", bg: "bg-amber-500/10" },
  TRAINING: { label: "Training", color: "text-accent", bg: "bg-accent/10" },
  COOLDOWN: { label: "Cooldown", color: "text-emerald-400", bg: "bg-emerald-500/10" },
};

/**
 * Create default builder structures.
 */
let _keyCounter = 0;
export function nextKey(): string {
  return `k_${++_keyCounter}_${Date.now()}`;
}

export function createDefaultExercise(): BuilderExercise {
  return {
    _key: nextKey(),
    exercise_id: "",
    exercise_name: "",
    reps: "12",
    notes: "",
    youtube_url_override: "",
  };
}

export function createDefaultCircuit(label: string): BuilderCircuit {
  return {
    _key: nextKey(),
    label,
    circuit_type: "TRAINING",
    weekly_sets: { "1": 3, "2": 3, "3": 4, "4": 4 },
    notes: "",
    exercises: [createDefaultExercise(), createDefaultExercise()],
  };
}

export function createDefaultDay(dayNumber: number): BuilderDay {
  return {
    _key: nextKey(),
    day_number: dayNumber,
    label: "",
    circuits: [
      { ...createDefaultCircuit("A"), circuit_type: "WARMUP", weekly_sets: { "1": 1, "2": 1, "3": 1, "4": 1 } },
      createDefaultCircuit("B"),
      createDefaultCircuit("C"),
      createDefaultCircuit("D"),
    ],
  };
}

/**
 * Convert builder state to the JSON structure expected by save_routine_structure RPC.
 */
export function builderToStructure(days: BuilderDay[]) {
  return {
    days: days.map((d, di) => ({
      day_number: d.day_number,
      label: d.label || null,
      sort_order: di,
      circuits: d.circuits.map((c, ci) => ({
        label: c.label,
        circuit_type: c.circuit_type,
        weekly_sets: c.weekly_sets,
        sort_order: ci,
        notes: c.notes || null,
        exercises: c.exercises
          .filter((e) => e.exercise_id) // skip empty exercises
          .map((e, ei) => ({
            exercise_id: e.exercise_id,
            reps: e.reps || null,
            notes: e.notes || null,
            youtube_url_override: e.youtube_url_override || null,
            sort_order: ei,
          })),
      })),
    })),
  };
}

/**
 * Convert an ActiveRoutine (from RPC) back into builder state for editing.
 */
export function routineToBuilder(routine: ActiveRoutine): BuilderDay[] {
  return routine.days.map((d) => ({
    _key: nextKey(),
    day_number: d.day_number,
    label: d.label ?? "",
    circuits: d.circuits.map((c) => ({
      _key: nextKey(),
      label: c.label,
      circuit_type: c.circuit_type,
      weekly_sets: c.weekly_sets,
      notes: c.notes ?? "",
      exercises: c.exercises.map((e) => ({
        _key: nextKey(),
        exercise_id: e.exercise_id,
        exercise_name: e.exercise_name,
        reps: e.reps ?? "",
        notes: e.notes ?? "",
        youtube_url_override: "",
      })),
    })),
  }));
}
