"use client";

import type { WeeklySets } from "@/lib/routine";

type Props = {
  totalWeeks: number;
  weeklySets: WeeklySets;
  onChange: (weeklySets: WeeklySets) => void;
};

export function WeeklySetsEditor({ totalWeeks, weeklySets, onChange }: Props) {
  function handleChange(week: number, value: string) {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    onChange({ ...weeklySets, [String(week)]: num });
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted">Sets per week</p>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
          <div key={week} className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-muted">W{week}</span>
            <input
              type="number"
              min={0}
              max={20}
              value={weeklySets[String(week)] ?? ""}
              onChange={(e) => handleChange(week, e.target.value)}
              className="h-8 w-10 rounded-lg border border-white/10 bg-card2 text-center text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent/60"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
