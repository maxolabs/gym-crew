"use client";

import { useState } from "react";
import { RoutineDayPicker } from "./RoutineDayPicker";
import { CircuitCard } from "./CircuitCard";
import { Button } from "@/components/ui/Button";
import { computeCurrentWeek } from "@/lib/routine";
import { Dumbbell, Calendar } from "lucide-react";
import type { ActiveRoutine } from "@/lib/routine";

type Props = {
  routine: ActiveRoutine;
  groupId: string;
  isAdmin: boolean;
};

export function SessionView({ routine, groupId, isAdmin }: Props) {
  const [selectedDay, setSelectedDay] = useState(0);
  const currentWeek = computeCurrentWeek(routine.start_date, routine.total_weeks);
  const day = routine.days[selectedDay];

  if (!day) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-text">{routine.name}</h3>
          <div className="flex items-center gap-2 text-xs text-muted">
            <Calendar className="h-3 w-3" />
            <span>
              Week {currentWeek} of {routine.total_weeks}
            </span>
          </div>
        </div>
        {isAdmin && (
          <Button
            href={`/g/${groupId}/routine/builder`}
            variant="secondary"
            className="text-xs"
          >
            Edit
          </Button>
        )}
      </div>

      <RoutineDayPicker
        days={routine.days}
        selectedIndex={selectedDay}
        onSelect={setSelectedDay}
      />

      <div className="space-y-2">
        {day.circuits.map((circuit) => (
          <CircuitCard
            key={circuit.id}
            circuit={circuit}
            currentWeek={currentWeek}
          />
        ))}
      </div>

      {!isAdmin && (
        <Button
          href={`/g/${groupId}/routine/workout?day=${day.id}&week=${currentWeek}`}
          size="lg"
          className="w-full"
        >
          <Dumbbell className="mr-2 h-5 w-5" />
          Start Workout
        </Button>
      )}
    </div>
  );
}
