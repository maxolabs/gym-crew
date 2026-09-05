"use client";

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import { getLevelColorClass } from "@/lib/xp-config";

type Props = {
  currentXP: number;
  currentLevel: number;
  levelTitle: string;
  levelColor: string;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
  className?: string;
};

export function XPProgressBar({
  currentXP,
  currentLevel,
  levelTitle,
  levelColor,
  xpForCurrentLevel,
  xpForNextLevel,
  progressPercent,
  className
}: Props) {
  const { t } = useTranslation("profile");
  const isMaxLevel = xpForNextLevel === xpForCurrentLevel;
  const xpInLevel = currentXP - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <span className={cn("text-sm font-semibold", getLevelColorClass(levelColor))}>
          {t("levelTitle", { level: currentLevel, title: levelTitle })}
        </span>
        <span className="text-xs text-muted">{t("xpLabel", { xp: currentXP })}</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            levelColor === "#6B7280" && "bg-gray-400",
            levelColor === "#3B82F6" && "bg-blue-400",
            levelColor === "#8B5CF6" && "bg-purple-400",
            levelColor === "#F59E0B" && "bg-amber-400",
            levelColor === "#EF4444" && "bg-red-400"
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {!isMaxLevel ? (
        <p className="text-xs text-muted">
          {t("xpToNext", { xp: xpNeeded - xpInLevel, level: currentLevel + 1 })}
        </p>
      ) : (
        <p className="text-xs text-muted">{t("maxLevel")}</p>
      )}
    </div>
  );
}
