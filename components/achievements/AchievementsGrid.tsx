"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { AchievementBadge } from "./AchievementBadge";
import type { AchievementCategory, AchievementDefinition } from "@/lib/achievements/types";

type Props = {
  definitions: AchievementDefinition[];
  earnedIds: Set<string>;
};

const categories: { value: AchievementCategory | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "STREAK", label: "Streak" },
  { value: "MILESTONE", label: "Milestone" },
  { value: "TIME", label: "Time" },
  { value: "CONSISTENCY", label: "Consistency" },
  { value: "SPECIAL", label: "Special" }
];

export function AchievementsGrid({ definitions, earnedIds }: Props) {
  const [filter, setFilter] = useState<AchievementCategory | "ALL">("ALL");

  const filtered =
    filter === "ALL"
      ? definitions
      : definitions.filter((d) => d.category === filter);

  // Sort: earned first, then by rarity (legendary > epic > rare > common)
  const rarityOrder: Record<string, number> = {
    LEGENDARY: 0,
    EPIC: 1,
    RARE: 2,
    COMMON: 3
  };

  const sorted = [...filtered].sort((a, b) => {
    const aEarned = earnedIds.has(a.id);
    const bEarned = earnedIds.has(b.id);

    if (aEarned !== bEarned) {
      return aEarned ? -1 : 1;
    }

    return rarityOrder[a.rarity] - rarityOrder[b.rarity];
  });

  const earnedCount = definitions.filter((d) => earnedIds.has(d.id)).length;
  const totalCount = definitions.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {earnedCount}/{totalCount} Earned
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              filter === cat.value
                ? "bg-accent text-white"
                : "bg-card2 text-muted hover:text-text"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sorted.map((def) => (
          <AchievementBadge
            key={def.id}
            achievement={def}
            earned={earnedIds.has(def.id)}
          />
        ))}
      </div>

      {sorted.length === 0 && (
        <p className="py-8 text-center text-sm text-muted">
          No achievements in this category.
        </p>
      )}
    </div>
  );
}
