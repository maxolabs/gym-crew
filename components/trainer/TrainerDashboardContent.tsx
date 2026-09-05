"use client";

import { useTranslation } from "react-i18next";
import { TopBar } from "@/components/nav/TopBar";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { StatsCard } from "@/components/ui/StatsCard";
import { Button } from "@/components/ui/Button";
import { Users, Layers, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

type Group = {
  id: string;
  name: string;
  routine_deadline: string | null;
  routine_name: string | null;
  clientCount: number;
};

type Props = {
  groups: Group[];
  totalClients: number;
  pendingCount: number;
  expiredRoutines: number;
};

export function TrainerDashboardContent({
  groups,
  totalClients,
  pendingCount,
  expiredRoutines
}: Props) {
  const { t } = useTranslation(["trainer", "common"]);

  return (
    <div className="space-y-4">
      <TopBar title={t("trainer:trainerDashboard")} />

      <div className="grid grid-cols-2 gap-3">
        <StatsCard
          icon={<Users className="h-5 w-5" />}
          value={totalClients}
          label={t("trainer:totalClients")}
        />
        <StatsCard
          icon={<Layers className="h-5 w-5" />}
          value={groups.length}
          label={t("common:groups")}
        />
        {pendingCount > 0 && (
          <StatsCard
            icon={<Clock className="h-5 w-5" />}
            value={pendingCount}
            label={t("trainer:pendingApprovals")}
            className="border-warning/30 bg-warning/5"
          />
        )}
        {expiredRoutines > 0 && (
          <StatsCard
            icon={<AlertCircle className="h-5 w-5" />}
            value={expiredRoutines}
            label={t("trainer:expiredRoutines")}
            className="border-danger/30 bg-danger/5"
          />
        )}
      </div>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle>{t("trainer:yourGroups")}</CardTitle>
          <Button href="/trainer/groups/new" variant="secondary" className="h-9 px-3 text-sm">
            {t("trainer:newGroup")}
          </Button>
        </div>

        {!groups.length ? (
          <div className="py-4 text-center">
            <CardMeta>{t("trainer:noGroupsCreated")}</CardMeta>
            <Button href="/trainer/groups/new" className="mt-3">
              {t("trainer:createFirstGroup")}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {groups.slice(0, 5).map((g) => {
              const hasExpiredRoutine =
                g.routine_deadline && new Date(g.routine_deadline) < new Date();

              return (
                <Link
                  key={g.id}
                  href={`/trainer/groups/${g.id}`}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-card2 p-3 transition-colors hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text">{g.name}</p>
                    <p className="text-xs text-muted">
                      {t("common:client", { count: g.clientCount })}
                      {g.routine_name && ` • ${g.routine_name}`}
                    </p>
                  </div>
                  {hasExpiredRoutine && (
                    <span className="ml-2 shrink-0 rounded-full bg-danger/10 px-2 py-1 text-xs font-medium text-danger">
                      {t("common:expired")}
                    </span>
                  )}
                </Link>
              );
            })}
            {groups.length > 5 && (
              <Button href="/trainer/groups" variant="ghost" className="w-full">
                {t("trainer:viewAllGroups", { count: groups.length })}
              </Button>
            )}
          </div>
        )}
      </Card>

      <Card className="space-y-2">
        <CardTitle>{t("trainer:quickActions")}</CardTitle>
        <div className="grid grid-cols-2 gap-2">
          <Button href="/trainer/groups/new" variant="secondary" className="h-12">
            {t("trainer:createGroup")}
          </Button>
          <Button href="/trainer/groups" variant="secondary" className="h-12">
            {t("trainer:manageGroups")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
