import { cn } from "@/lib/cn";
import type React from "react";

type Props = {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  className?: string;
};

export function StatsCard({ icon, value, label, className }: Props) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-card p-4",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          {icon}
        </div>
        <div>
          <p className="text-xl font-bold text-text">{value}</p>
          <p className="text-xs text-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}
