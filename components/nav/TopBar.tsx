import { cn } from "@/lib/cn";
import type React from "react";

export function TopBar({
  title,
  right,
  className
}: {
  title: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-center justify-between", className)}>
      <h1 className="text-xl font-bold tracking-tight">{title}</h1>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}


