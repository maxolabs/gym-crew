"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { ExerciseSearchSheet } from "./ExerciseSearchSheet";
import { GripVertical, Search, X } from "lucide-react";
import type { BuilderExercise, Exercise } from "@/lib/routine";

type Props = {
  exercise: BuilderExercise;
  onChange: (exercise: BuilderExercise) => void;
  onRemove: () => void;
};

export function ExerciseEditor({ exercise, onChange, onRemove }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);

  function handleSelect(ex: Exercise) {
    onChange({
      ...exercise,
      exercise_id: ex.id,
      exercise_name: ex.name,
    });
  }

  return (
    <div className="flex items-start gap-2 rounded-xl border border-white/5 bg-card2/50 p-2.5">
      <GripVertical className="mt-2 h-4 w-4 shrink-0 text-muted/40" />

      <div className="flex-1 space-y-2">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex h-9 w-full items-center gap-2 rounded-lg border border-white/10 bg-card2 px-2.5 text-left text-sm transition hover:bg-white/5"
        >
          <Search className="h-3.5 w-3.5 text-muted" />
          <span className={exercise.exercise_name ? "text-text" : "text-muted"}>
            {exercise.exercise_name || "Select exercise..."}
          </span>
        </button>

        <div className="flex gap-2">
          <div className="w-24">
            <Input
              value={exercise.reps}
              onChange={(e) => onChange({ ...exercise, reps: e.target.value })}
              placeholder="Reps"
              className="h-8 text-xs"
            />
          </div>
          <div className="flex-1">
            <Input
              value={exercise.notes}
              onChange={(e) => onChange({ ...exercise, notes: e.target.value })}
              placeholder="Notes (optional)"
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="mt-2 p-1 text-muted hover:text-danger transition"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <ExerciseSearchSheet
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleSelect}
      />
    </div>
  );
}
