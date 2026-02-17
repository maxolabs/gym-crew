"use client";

import { cn } from "@/lib/cn";
import { getLevelColorClass, getLevelBgClass, getLevelBorderClass } from "@/lib/xp-config";

type Props = {
  level: number;
  title?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  showTitle?: boolean;
  className?: string;
};

export function LevelBadge({
  level,
  title,
  color = "#6B7280",
  size = "md",
  showTitle = false,
  className
}: Props) {
  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-12 w-12 text-lg"
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full border-2 font-bold",
          getLevelBgClass(color),
          getLevelBorderClass(color),
          getLevelColorClass(color),
          sizeClasses[size]
        )}
        title={title ? `Level ${level}: ${title}` : `Level ${level}`}
      >
        {level}
      </div>
      {showTitle && title && (
        <span className={cn("text-sm font-medium", getLevelColorClass(color))}>
          {title}
        </span>
      )}
    </div>
  );
}
