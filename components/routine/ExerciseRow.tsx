"use client";

import { YouTubeLink } from "./YouTubeLink";
import type { RoutineExercise } from "@/lib/routine";

type Props = {
  exercise: RoutineExercise;
  index: number;
};

export function ExerciseRow({ exercise, index }: Props) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
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
      {exercise.youtube_url && <YouTubeLink url={exercise.youtube_url} />}
    </div>
  );
}
