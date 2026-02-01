"use client";

import { cn } from "@/lib/cn";
import type { AchievementDefinition, AchievementRarity } from "@/lib/achievements/types";
import {
  Lock,
  Flame,
  Crown,
  Target,
  Medal,
  Trophy,
  Sunrise,
  Moon,
  Calendar,
  CheckCircle,
  Star,
  Footprints,
  Users,
  type LucideIcon
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Flame,
  Crown,
  Target,
  Medal,
  Trophy,
  Sunrise,
  Moon,
  Calendar,
  CheckCircle,
  Star,
  Footprints,
  Users
};

const rarityStyles: Record<AchievementRarity, string> = {
  COMMON: "border-muted/30 bg-muted/5 text-muted",
  RARE: "border-blue-500/30 bg-blue-500/5 text-blue-400",
  EPIC: "border-purple-500/30 bg-purple-500/5 text-purple-400",
  LEGENDARY: "border-amber-500/30 bg-amber-500/5 text-amber-400"
};

const rarityIconStyles: Record<AchievementRarity, string> = {
  COMMON: "bg-muted/10 text-muted",
  RARE: "bg-blue-500/10 text-blue-400",
  EPIC: "bg-purple-500/10 text-purple-400",
  LEGENDARY: "bg-amber-500/10 text-amber-400"
};

type Props = {
  achievement: AchievementDefinition;
  earned: boolean;
  size?: "sm" | "md" | "lg";
  showXP?: boolean;
};

export function AchievementBadge({ achievement, earned, size = "md", showXP = true }: Props) {
  const Icon = iconMap[achievement.icon] ?? Target;
  const isLegendary = achievement.rarity === "LEGENDARY";

  const sizeClasses = {
    sm: {
      container: "p-2",
      icon: "h-8 w-8",
      iconSize: "h-4 w-4",
      title: "text-xs",
      desc: "text-[10px]",
      xp: "text-[10px] px-1.5 py-0.5"
    },
    md: {
      container: "p-3",
      icon: "h-10 w-10",
      iconSize: "h-5 w-5",
      title: "text-sm",
      desc: "text-xs",
      xp: "text-xs px-2 py-0.5"
    },
    lg: {
      container: "p-4",
      icon: "h-12 w-12",
      iconSize: "h-6 w-6",
      title: "text-base",
      desc: "text-sm",
      xp: "text-sm px-2.5 py-1"
    }
  };

  const s = sizeClasses[size];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border",
        earned ? rarityStyles[achievement.rarity] : "border-white/5 bg-white/[0.02]",
        s.container
      )}
    >
      {/* Shimmer effect for legendary */}
      {earned && isLegendary && (
        <div
          className="pointer-events-none absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-amber-500/10 to-transparent"
          style={{ backgroundSize: "200% 100%" }}
        />
      )}

      <div className="relative flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full",
            s.icon,
            earned ? rarityIconStyles[achievement.rarity] : "bg-white/5 text-muted/50"
          )}
        >
          <Icon className={cn(s.iconSize, !earned && "opacity-50")} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                "font-semibold",
                s.title,
                !earned && "text-muted/50"
              )}
            >
              {achievement.name}
            </p>
            {showXP && earned && (
              <span
                className={cn(
                  "shrink-0 rounded-full font-medium",
                  s.xp,
                  rarityIconStyles[achievement.rarity]
                )}
              >
                +{achievement.xp_reward} XP
              </span>
            )}
          </div>
          <p
            className={cn(
              s.desc,
              earned ? "text-muted" : "text-muted/40"
            )}
          >
            {achievement.description}
          </p>
        </div>

        {/* Lock overlay for unearned */}
        {!earned && (
          <div className="absolute right-2 top-2">
            <Lock className="h-4 w-4 text-muted/30" />
          </div>
        )}
      </div>
    </div>
  );
}
