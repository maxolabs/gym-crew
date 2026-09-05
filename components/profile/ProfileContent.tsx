"use client";

import { useTranslation } from "react-i18next";
import { TopBar } from "@/components/nav/TopBar";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Award, ChevronRight, Trophy } from "lucide-react";
import { AchievementBadge } from "@/components/achievements/AchievementBadge";
import { LevelBadge, XPProgressBar } from "@/components/xp";
import { useLanguage } from "@/lib/i18n/I18nProvider";
import { formatDateShort } from "@/lib/i18n/format";
import type { AchievementDefinition } from "@/lib/achievements/types";

type Badge = {
  id: string;
  group_id: string;
  badge_type: string;
  period_start: string;
  period_end: string;
  created_at: string;
  gym_groups: { name: string } | null;
};

type UserAchievement = {
  id: string;
  earned_at: string;
  achievement_definitions: AchievementDefinition;
};

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
  profile: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    user_type: string;
  };
  groupCount: number;
  totalApproved: number;
  badges: Badge[];
  recentAchievements: UserAchievement[];
  level: LevelInfo;
};

export function ProfileContent({
  profile,
  groupCount,
  totalApproved,
  badges,
  recentAchievements,
  level
}: Props) {
  const { t } = useTranslation(["profile", "common"]);
  const { language, setLanguage } = useLanguage();
  const isTrainer = profile.user_type === "TRAINER";

  return (
    <div className="space-y-3">
      <TopBar title={t("profile:profile")} right={<LogoutButton />} />

      <Card className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar
              src={profile.avatar_url}
              name={profile.name}
              size="lg"
              showTrainerBadge={isTrainer}
            />
            <div className="absolute -bottom-1 -right-1">
              <LevelBadge
                level={level.current_level}
                title={level.level_title}
                color={level.level_color}
                size="sm"
              />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">{profile.name}</CardTitle>
            <CardMeta className="truncate">{profile.email}</CardMeta>
            <span
              className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isTrainer
                  ? "bg-accent/10 text-accent"
                  : "bg-card2 text-muted"
              }`}
            >
              {isTrainer ? t("common:trainer") : t("common:client")}
            </span>
          </div>
        </div>
      </Card>

      <Card className="space-y-3">
        <XPProgressBar
          currentXP={level.total_xp}
          currentLevel={level.current_level}
          levelTitle={level.level_title}
          levelColor={level.level_color}
          xpForCurrentLevel={level.xp_for_current_level}
          xpForNextLevel={level.xp_for_next_level}
          progressPercent={level.progress_percent}
        />
      </Card>

      <Card className="space-y-2">
        <CardTitle>{t("profile:stats")}</CardTitle>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-card2 px-3 py-3">
            <p className="text-xs text-muted">{t("common:groups")}</p>
            <p className="text-2xl font-bold">{groupCount}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-card2 px-3 py-3">
            <p className="text-xs text-muted">{t("common:checkIns")}</p>
            <p className="text-2xl font-bold">{totalApproved}</p>
          </div>
        </div>
      </Card>

      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-warning" />
            <CardTitle>{t("profile:personalRecords")}</CardTitle>
          </div>
          <Button
            href="/profile/records"
            variant="ghost"
            className="h-8 gap-1 px-2 text-xs text-muted"
          >
            {t("common:viewAll")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <CardMeta>{t("profile:personalRecordsDesc")}</CardMeta>
      </Card>

      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle>{t("profile:achievements")}</CardTitle>
          <Button
            href="/achievements"
            variant="ghost"
            className="h-8 gap-1 px-2 text-xs text-muted"
          >
            {t("common:viewAll")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {!recentAchievements?.length ? (
          <CardMeta>{t("profile:noAchievements")}</CardMeta>
        ) : (
          <div className="space-y-2">
            {recentAchievements.map((ua) => (
              <AchievementBadge
                key={ua.id}
                achievement={ua.achievement_definitions}
                earned={true}
                size="sm"
              />
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-2">
        <CardTitle>{t("profile:badgesTitle")}</CardTitle>
        {!badges?.length ? (
          <CardMeta>{t("profile:noBadges")}</CardMeta>
        ) : (
          <div className="space-y-2">
            {badges.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-card2 p-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning">
                  <Award className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {b.badge_type === "MONTH_WINNER" ? t("common:monthWinner") : b.badge_type}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {b.gym_groups?.name} •{" "}
                    {formatDateShort(b.period_start)}
                  </p>
                </div>
                <Button
                  href={`/g/${b.group_id}`}
                  variant="ghost"
                  className="h-9 shrink-0 px-3 text-xs"
                >
                  {t("common:view")}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Options Card */}
      <Card className="space-y-3">
        <CardTitle>{t("profile:options")}</CardTitle>
        <div className="space-y-2">
          <p className="text-xs text-muted">{t("profile:language")}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setLanguage("en")}
              className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                language === "en"
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-white/10 bg-card2 text-muted hover:text-text"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage("es")}
              className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                language === "es"
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-white/10 bg-card2 text-muted hover:text-text"
              }`}
            >
              ES
            </button>
          </div>
        </div>
      </Card>

      {isTrainer && (
        <Card className="space-y-2">
          <CardTitle>{t("profile:trainerActions")}</CardTitle>
          <div className="flex gap-2">
            <Button href="/trainer" variant="secondary" className="flex-1">
              {t("common:dashboard")}
            </Button>
            <Button href="/trainer/groups" variant="secondary" className="flex-1">
              {t("profile:manageGroups")}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
