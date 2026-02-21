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
      <div className="flex flex-col items-center gap-1.5 text-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
          {icon}
        </div>
        <p className="text-xl font-bold text-text">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}
