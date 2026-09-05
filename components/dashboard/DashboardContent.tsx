"use client";

import { useTranslation } from "react-i18next";
import { TopBar } from "@/components/nav/TopBar";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { StatsCard } from "@/components/ui/StatsCard";
import { Button } from "@/components/ui/Button";
import { CountdownBadge } from "@/components/ui/CountdownBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActivityFeed, type ActivityItem } from "@/components/group/ActivityFeed";
import { Calendar, Flame, Award, Layers } from "lucide-react";
import { formatDateShort } from "@/lib/i18n/format";
import Link from "next/link";

type GroupWithStats = {
  id: string;
  name: string;
  trainer_name: string;
  routine_name: string | null;
  routine_deadline: string | null;
  my_month_count: number;
};

type Badge = {
  id: string;
  badge_type: string;
  period_start: string;
  period_end: string;
  group_id: string;
  gym_groups: { name: string } | null;
};

type Props = {
  profileName: string;
  groupsWithStats: GroupWithStats[] | null;
  totalMonthCheckins: number;
  globalStreak: number;
  badges: Badge[] | null;
  todayCheckedGroups: Set<string>;
  activityItems: ActivityItem[];
  profileId: string;
};

export function DashboardContent({
  profileName,
  groupsWithStats,
  totalMonthCheckins,
  globalStreak,
  badges,
  todayCheckedGroups,
  activityItems,
  profileId
}: Props) {
  const { t } = useTranslation(["dashboard", "common"]);

  return (
    <div className="space-y-4">
      <TopBar title={t("dashboard:greeting", { name: profileName.split(" ")[0] })} />

      <div className="grid grid-cols-3 gap-2">
        <StatsCard
          icon={<Calendar className="h-4 w-4" />}
          value={totalMonthCheckins}
          label={t("common:thisMonth")}
        />
        <StatsCard
          icon={<Flame className="h-4 w-4" />}
          value={globalStreak}
          label={t("common:dayStreak")}
        />
        <StatsCard
          icon={<Award className="h-4 w-4" />}
          value={badges?.length ?? 0}
          label={t("common:badges")}
        />
      </div>

      {!groupsWithStats?.length ? (
        <EmptyState
          icon={<Layers className="h-7 w-7" />}
          title={t("dashboard:noGroupsTitle")}
          description={t("dashboard:noGroupsDesc")}
          action={
            <Button href="/groups">{t("dashboard:findGroups")}</Button>
          }
        />
      ) : (
        <>
          <Card className="space-y-3">
            <CardTitle>{t("dashboard:todaysCheckins")}</CardTitle>
            <div className="space-y-2">
              {groupsWithStats.map((g) => {
                const checkedIn = todayCheckedGroups.has(g.id);
                const hasActiveRoutine =
                  g.routine_deadline && new Date(g.routine_deadline) > new Date();

                return (
                  <Link
                    key={g.id}
                    href={`/g/${g.id}`}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-card2 p-3 transition-colors hover:bg-white/5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-text">{g.name}</p>
                      <p className="text-xs text-muted">
                        {t("dashboard:by", { name: g.trainer_name })}
                        {g.routine_name && ` • ${g.routine_name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasActiveRoutine && g.routine_deadline && (
                        <CountdownBadge deadline={g.routine_deadline} />
                      )}
                      {checkedIn ? (
                        <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                          {t("common:done")}
                        </span>
                      ) : (
                        <Button variant="primary" className="h-8 px-3 text-xs">
                          {t("common:checkIn")}
                        </Button>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>

          {activityItems.length > 0 && (
            <ActivityFeed
              items={activityItems}
              currentUserId={profileId}
              showGroupName
            />
          )}

          {(badges?.length ?? 0) > 0 && (
            <Card className="space-y-3">
              <CardTitle>{t("dashboard:recentBadges")}</CardTitle>
              <div className="space-y-2">
                {badges?.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-card2 p-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10 text-warning">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">
                        {b.badge_type === "MONTH_WINNER" ? t("common:monthWinner") : b.badge_type}
                      </p>
                      <p className="text-xs text-muted">
                        {b.gym_groups?.name} •{" "}
                        {formatDateShort(b.period_start)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
