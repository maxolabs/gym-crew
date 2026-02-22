"use client";

import { ChevronRight } from "lucide-react";
import type { RoutineExercise } from "@/lib/routine";

type Props = {
  exercise: RoutineExercise;
  index: number;
  onClick: () => void;
};

export function ExerciseRow({ exercise, index, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-2 py-1.5 text-left transition hover:bg-white/[0.02] -mx-1 px-1 rounded-lg"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/5 text-[10px] text-muted">
          {index + 1}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text">
            {exercise.exercise_name}
          </p>
          <div className="flex items-center gap-2">
            {exercise.reps && (
              <span className="text-xs text-muted">{exercise.reps} reps</span>
            )}
            {exercise.notes && (
              <span className="text-xs text-muted/70">· {exercise.notes}</span>
            )}
          </div>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted/40" />
    </button>
  );
}
