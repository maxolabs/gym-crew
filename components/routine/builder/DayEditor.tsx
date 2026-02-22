"use client";

import { Input } from "@/components/ui/Input";
import { CircuitEditor } from "./CircuitEditor";
import { createDefaultCircuit } from "@/lib/routine";
import { Plus, Trash2 } from "lucide-react";
import type { BuilderDay, BuilderCircuit } from "@/lib/routine";

type Props = {
  day: BuilderDay;
  totalWeeks: number;
  onChange: (day: BuilderDay) => void;
  onRemove: () => void;
};

const LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export function DayEditor({ day, totalWeeks, onChange, onRemove }: Props) {
  function updateCircuit(index: number, updated: BuilderCircuit) {
    const circuits = [...day.circuits];
    circuits[index] = updated;
    onChange({ ...day, circuits });
  }

  function removeCircuit(index: number) {
    onChange({
      ...day,
      circuits: day.circuits.filter((_, i) => i !== index),
    });
  }

  function addCircuit() {
    const nextLabel = LABELS[day.circuits.length] ?? `${day.circuits.length + 1}`;
    onChange({
      ...day,
      circuits: [...day.circuits, createDefaultCircuit(nextLabel)],
    });
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-card2/30 p-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent">
          D{day.day_number}
        </div>
        <Input
          value={day.label}
          onChange={(e) => onChange({ ...day, label: e.target.value })}
          placeholder={`Day ${day.day_number} label (e.g. Upper Body)`}
          className="h-8 flex-1 text-xs"
        />
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-muted hover:text-danger transition"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2">
        {day.circuits.map((circuit, i) => (
          <CircuitEditor
            key={circuit._key}
            circuit={circuit}
            totalWeeks={totalWeeks}
            onChange={(updated) => updateCircuit(i, updated)}
            onRemove={() => removeCircuit(i)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addCircuit}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/10 py-2.5 text-xs text-muted hover:text-text transition"
      >
        <Plus className="h-4 w-4" />
        Add Circuit
      </button>
    </div>
  );
}
