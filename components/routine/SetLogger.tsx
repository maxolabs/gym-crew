"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ExerciseLog } from "@/lib/routine";

type Props = {
  exerciseName: string;
  circuitExerciseId: string;
  setsCount: number;
  reps: string | null;
  existingLogs: ExerciseLog[];
  onLogSet: (
    circuitExerciseId: string,
    setNumber: number,
    weightKg: number,
    repsDone: number
  ) => void;
};

export function SetLogger({
  exerciseName,
  circuitExerciseId,
  setsCount,
  reps,
  existingLogs,
  onLogSet,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  function getExistingLog(setNum: number) {
    return existingLogs.find(
      (l) => l.circuit_exercise_id === circuitExerciseId && l.set_number === setNum
    );
  }

  return (
    <div className="rounded-lg border border-white/5 bg-card2/50">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-3 py-2"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text">{exerciseName}</span>
          {reps && <span className="text-xs text-muted">{reps}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">
            {existingLogs.filter((l) => l.circuit_exercise_id === circuitExerciseId).length}/{setsCount}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="space-y-1.5 border-t border-white/5 px-3 py-2">
          <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 text-[10px] text-muted">
            <span>Set</span>
            <span>Weight (kg)</span>
            <span>Reps</span>
            <span />
          </div>
          {Array.from({ length: setsCount }, (_, i) => i + 1).map((setNum) => (
            <SetRow
              key={setNum}
              setNumber={setNum}
              existing={getExistingLog(setNum)}
              onSave={(weight, repsDone) =>
                onLogSet(circuitExerciseId, setNum, weight, repsDone)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SetRow({
  setNumber,
  existing,
  onSave,
}: {
  setNumber: number;
  existing: ExerciseLog | undefined;
  onSave: (weight: number, reps: number) => void;
}) {
  const [weight, setWeight] = useState(existing?.weight_kg?.toString() ?? "");
  const [repsDone, setRepsDone] = useState(existing?.reps_done?.toString() ?? "");
  const [saved, setSaved] = useState(!!existing);

  function handleSave() {
    const w = parseFloat(weight) || 0;
    const r = parseInt(repsDone, 10) || 0;
    if (r > 0) {
      onSave(w, r);
      setSaved(true);
    }
  }

  return (
    <div className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded bg-white/5 text-xs text-muted">
        {setNumber}
      </span>
      <input
        type="number"
        step="0.5"
        min="0"
        value={weight}
        onChange={(e) => {
          setWeight(e.target.value);
          setSaved(false);
        }}
        placeholder="0"
        className="h-8 w-full rounded-lg border border-white/10 bg-bg px-2 text-center text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent/60"
      />
      <input
        type="number"
        min="0"
        value={repsDone}
        onChange={(e) => {
          setRepsDone(e.target.value);
          setSaved(false);
        }}
        placeholder="0"
        className="h-8 w-full rounded-lg border border-white/10 bg-bg px-2 text-center text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent/60"
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={saved}
        className={`h-8 rounded-lg px-2.5 text-xs font-medium transition ${
          saved
            ? "bg-success/10 text-success"
            : "bg-accent/10 text-accent hover:bg-accent/20"
        }`}
      >
        {saved ? "Done" : "Save"}
      </button>
    </div>
  );
}
