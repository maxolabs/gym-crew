"use client";

import { useTranslation } from "react-i18next";
import { TopBar } from "@/components/nav/TopBar";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CountdownBadge } from "@/components/ui/CountdownBadge";
import { Layers, Plus } from "lucide-react";
import Link from "next/link";

type Group = {
  id: string;
  name: string;
  description: string | null;
  timezone: string;
  routine_url: string | null;
  routine_name: string | null;
  routine_deadline: string | null;
  clientCount: number;
};

type Props = {
  groups: Group[];
};

export function TrainerGroupsContent({ groups }: Props) {
  const { t } = useTranslation(["trainer", "common"]);

  return (
    <div className="space-y-3">
      <TopBar
        title={t("trainer:yourGroups")}
        right={
          <Button href="/trainer/groups/new" className="h-10 gap-1.5 px-3">
            <Plus className="h-4 w-4" />
            {t("common:new")}
          </Button>
        }
      />

      {!groups.length ? (
        <EmptyState
          icon={<Layers className="h-7 w-7" />}
          title={t("groups:noGroupsTitle")}
          description={t("trainer:noGroupsDesc")}
          action={
            <Button href="/trainer/groups/new">{t("trainer:createGroup")}</Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {groups.map((g) => {
            const hasRoutine = !!g.routine_url;
            const hasExpiredRoutine =
              g.routine_deadline && new Date(g.routine_deadline) < new Date();

            return (
              <Card key={g.id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate">{g.name}</CardTitle>
                    <CardMeta className="truncate">
                      {g.description || t("common:noDescription")}
                    </CardMeta>
                  </div>
                  <Button
                    href={`/trainer/groups/${g.id}`}
                    variant="secondary"
                    className="shrink-0"
                  >
                    {t("common:manage")}
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-card2 px-2.5 py-1 text-muted">
                    {t("common:client", { count: g.clientCount })}
                  </span>
                  <span className="rounded-full bg-card2 px-2.5 py-1 text-muted">
                    {g.timezone}
                  </span>
                  {hasRoutine && !hasExpiredRoutine && g.routine_deadline && (
                    <CountdownBadge deadline={g.routine_deadline} />
                  )}
                  {hasExpiredRoutine && (
                    <span className="rounded-full bg-danger/10 px-2.5 py-1 font-medium text-danger">
                      {t("trainer:routineExpired")}
                    </span>
                  )}
                  {!hasRoutine && (
                    <span className="rounded-full bg-warning/10 px-2.5 py-1 font-medium text-warning">
                      {t("trainer:noRoutine")}
                    </span>
                  )}
                </div>

                <Link
                  href={`/g/${g.id}`}
                  className="block text-xs text-muted hover:text-text"
                >
                  {t("trainer:viewClientDashboard")}
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
