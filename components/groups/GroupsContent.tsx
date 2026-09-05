"use client";

import { useTranslation } from "react-i18next";
import { TopBar } from "@/components/nav/TopBar";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CountdownBadge } from "@/components/ui/CountdownBadge";
import { Layers } from "lucide-react";

type GroupWithStats = {
  id: string;
  name: string;
  description: string | null;
  trainer_name: string;
  routine_name: string | null;
  routine_deadline: string | null;
  my_month_count: number;
};

type Props = {
  isTrainer: boolean;
  withStats: GroupWithStats[] | null;
};

export function GroupsContent({ isTrainer, withStats }: Props) {
  const { t } = useTranslation(["groups", "common"]);

  return (
    <div className="space-y-3">
      <TopBar
        title={t("groups:myGroups")}
        right={
          isTrainer ? (
            <Button href="/trainer/groups/new">{t("common:create")}</Button>
          ) : null
        }
      />

      {!withStats?.length ? (
        <EmptyState
          icon={<Layers className="h-7 w-7" />}
          title={t("groups:noGroupsTitle")}
          description={
            isTrainer
              ? t("groups:trainerNoGroupsDesc")
              : t("groups:clientNoGroupsDesc")
          }
          action={
            isTrainer ? (
              <Button href="/trainer/groups/new">{t("groups:createGroup")}</Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-3">
          {withStats.map((g) => {
            const hasActiveRoutine =
              g.routine_deadline && new Date(g.routine_deadline) > new Date();
            const hasExpiredRoutine =
              g.routine_deadline && new Date(g.routine_deadline) <= new Date();

            return (
              <Card key={g.id} className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate">{g.name}</CardTitle>
                    <CardMeta className="truncate">
                      {g.description || t("groups:trainerLabel", { name: g.trainer_name })}
                    </CardMeta>
                  </div>
                  <Button href={`/g/${g.id}`} variant="secondary">
                    {t("common:open")}
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-card2 px-2.5 py-1 text-xs text-muted">
                    {t("groups:checkInsThisMonth", { count: g.my_month_count })}
                  </span>
                  {g.routine_name && hasActiveRoutine && g.routine_deadline && (
                    <CountdownBadge deadline={g.routine_deadline} />
                  )}
                  {hasExpiredRoutine && (
                    <span className="rounded-full bg-muted/10 px-2.5 py-1 text-xs text-muted">
                      {t("groups:routineEnded")}
                    </span>
                  )}
                </div>

                {!isTrainer && (
                  <p className="text-xs text-muted">
                    {t("groups:trainerLabel", { name: g.trainer_name })}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {!isTrainer && withStats && withStats.length > 0 && (
        <Card className="text-center">
          <CardMeta className="mb-2">
            {t("groups:inviteHint")}
          </CardMeta>
        </Card>
      )}
    </div>
  );
}
