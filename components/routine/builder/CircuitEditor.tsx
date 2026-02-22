"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ExerciseEditor } from "./ExerciseEditor";
import { WeeklySetsEditor } from "./WeeklySetsEditor";
import { CIRCUIT_TYPE_CONFIG, createDefaultExercise } from "@/lib/routine";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { BuilderCircuit, CircuitType } from "@/lib/routine";

type Props = {
  circuit: BuilderCircuit;
  totalWeeks: number;
  onChange: (circuit: BuilderCircuit) => void;
  onRemove: () => void;
};

export function CircuitEditor({ circuit, totalWeeks, onChange, onRemove }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const typeConfig = CIRCUIT_TYPE_CONFIG[circuit.circuit_type];

  function updateExercise(index: number, updated: BuilderCircuit["exercises"][0]) {
    const exercises = [...circuit.exercises];
    exercises[index] = updated;
    onChange({ ...circuit, exercises });
  }

  function removeExercise(index: number) {
    onChange({
      ...circuit,
      exercises: circuit.exercises.filter((_, i) => i !== index),
    });
  }

  function addExercise() {
    onChange({
      ...circuit,
      exercises: [...circuit.exercises, createDefaultExercise()],
    });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-card p-3 space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-0.5 text-muted hover:text-text transition"
        >
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>

        <div className="flex items-center gap-2 flex-1">
          <Input
            value={circuit.label}
            onChange={(e) => onChange({ ...circuit, label: e.target.value })}
            placeholder="Label"
            className="h-8 w-14 text-center text-xs font-bold"
          />
          <select
            value={circuit.circuit_type}
            onChange={(e) =>
              onChange({ ...circuit, circuit_type: e.target.value as CircuitType })
            }
            className="h-8 rounded-lg border border-white/10 bg-card2 px-2 text-xs text-text"
          >
            <option value="WARMUP">Warmup</option>
            <option value="TRAINING">Training</option>
            <option value="COOLDOWN">Cooldown</option>
          </select>
          <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${typeConfig.bg} ${typeConfig.color}`}>
            {circuit.exercises.length} exercises
          </span>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-muted hover:text-danger transition"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {!collapsed && (
        <>
          <WeeklySetsEditor
            totalWeeks={totalWeeks}
            weeklySets={circuit.weekly_sets}
            onChange={(weeklySets) => onChange({ ...circuit, weekly_sets: weeklySets })}
          />

          <div className="space-y-2">
            {circuit.exercises.map((ex, i) => (
              <ExerciseEditor
                key={ex._key}
                exercise={ex}
                onChange={(updated) => updateExercise(i, updated)}
                onRemove={() => removeExercise(i)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={addExercise}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/10 py-2 text-xs text-muted hover:text-text transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Exercise
          </button>
        </>
      )}
    </div>
  );
}
