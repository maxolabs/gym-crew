"use client";

import { useTranslation } from "react-i18next";
import { TopBar } from "@/components/nav/TopBar";
import { Card, CardTitle } from "@/components/ui/Card";
import { AchievementsGrid } from "@/components/achievements/AchievementsGrid";
import { LevelBadge, XPProgressBar } from "@/components/xp";
import type { AchievementDefinition } from "@/lib/achievements/types";

type LevelInfo = {
  total_xp: number;
  current_level: number;
  level_title: string;
  level_color: string;
  xp_for_current_level: number;
  xp_for_next_level: number;
  progress_percent: number;
};

type Props = {
  definitions: AchievementDefinition[];
  earnedIds: Set<string>;
  level: LevelInfo;
};

export function AchievementsContent({ definitions, earnedIds, level }: Props) {
  const { t } = useTranslation("profile");

  return (
    <div className="space-y-4">
      <TopBar title={t("achievements")} />

      <Card className="space-y-3">
        <div className="flex items-center gap-4">
          <LevelBadge
            level={level.current_level}
            title={level.level_title}
            color={level.level_color}
            size="lg"
          />
          <div className="flex-1">
            <XPProgressBar
              currentXP={level.total_xp}
              currentLevel={level.current_level}
              levelTitle={level.level_title}
              levelColor={level.level_color}
              xpForCurrentLevel={level.xp_for_current_level}
              xpForNextLevel={level.xp_for_next_level}
              progressPercent={level.progress_percent}
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle className="mb-4">{t("allAchievements")}</CardTitle>
        <AchievementsGrid
          definitions={definitions}
          earnedIds={earnedIds}
        />
      </Card>
    </div>
  );
}
