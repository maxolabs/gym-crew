"use client";

import { ExerciseRow } from "./ExerciseRow";
import { CIRCUIT_TYPE_CONFIG, getSetsForWeek } from "@/lib/routine";
import type { RoutineCircuit } from "@/lib/routine";

type Props = {
  circuit: RoutineCircuit;
  currentWeek: number;
};

export function CircuitCard({ circuit, currentWeek }: Props) {
  const typeConfig = CIRCUIT_TYPE_CONFIG[circuit.circuit_type];
  const sets = getSetsForWeek(circuit.weekly_sets, currentWeek);

  return (
    <div className="rounded-xl border border-white/10 bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-text">{circuit.label}</span>
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${typeConfig.bg} ${typeConfig.color}`}
          >
            {typeConfig.label}
          </span>
        </div>
        <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-muted">
          {sets} {sets === 1 ? "set" : "sets"}
        </span>
      </div>

      {circuit.notes && (
        <p className="text-xs text-muted">{circuit.notes}</p>
      )}

      <div className="divide-y divide-white/5">
        {circuit.exercises.map((ex, i) => (
          <ExerciseRow key={ex.id} exercise={ex} index={i} />
        ))}
      </div>
    </div>
  );
}
