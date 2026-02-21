"use client";

import { cn } from "@/lib/cn";
import type { RoutineDay } from "@/lib/routine";

type Props = {
  days: RoutineDay[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

export function RoutineDayPicker({ days, selectedIndex, onSelect }: Props) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {days.map((day, i) => (
        <button
          key={day.id}
          type="button"
          onClick={() => onSelect(i)}
          className={cn(
            "shrink-0 rounded-xl px-3 py-2 text-xs font-medium transition",
            i === selectedIndex
              ? "bg-accent text-white"
              : "bg-card2 text-muted hover:text-text"
          )}
        >
          <span className="block font-bold">Day {day.day_number}</span>
          {day.label && (
            <span className="block text-[10px] opacity-75">{day.label}</span>
          )}
        </button>
      ))}
    </div>
  );
}
