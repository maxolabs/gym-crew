"use client";

import { useTranslation } from "react-i18next";
import { TopBar } from "@/components/nav/TopBar";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatsCard } from "@/components/ui/StatsCard";
import { CountdownBadge } from "@/components/ui/CountdownBadge";
import { Avatar } from "@/components/ui/Avatar";
import { RoutineUploader } from "@/components/group/RoutineUploader";
import { InviteLinkCard } from "@/components/group/InviteLinkCard";
import { PendingApprovals } from "@/components/group/PendingApprovals";
import { Users, Calendar, CheckCircle } from "lucide-react";
import { formatDateDay } from "@/lib/i18n/format";

type Member = {
  user_id: string;
  role: string;
  joined_at: string;
  users: { name: string; avatar_url: string | null } | null;
};

type PendingItem = {
  id: string;
  user_id: string;
  checkin_date: string;
  created_at: string;
  users: { name: string } | null;
};

type Props = {
  groupId: string;
  groupName: string;
  groupDescription: string | null;
  timezone: string;
  routineSignedUrl: string | null;
  routineContentType: string | null;
  routineName: string | null;
  routineDeadline: string | null;
  hasExpiredRoutine: boolean;
  profileId: string;
  members: Member[];
  locations: { id: string; name: string }[];
  totalCheckins: number;
  pending: PendingItem[];
  memberCheckins: Map<string, number>;
};

export function TrainerGroupDetailContent({
  groupId,
  groupName,
  groupDescription,
  timezone,
  routineSignedUrl,
  routineContentType,
  routineName,
  routineDeadline,
  hasExpiredRoutine,
  profileId,
  members,
  locations,
  totalCheckins,
  pending,
  memberCheckins
}: Props) {
  const { t } = useTranslation(["trainer", "common", "groups"]);

  const clientCount = Math.max(0, (members?.length ?? 0) - 1);

  return (
    <div className="space-y-4">
      <TopBar
        title={groupName}
        right={
          <Button href="/trainer/groups" variant="ghost">
            {t("common:back")}
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-2">
        <StatsCard
          icon={<Users className="h-4 w-4" />}
          value={clientCount}
          label={t("common:clients")}
        />
        <StatsCard
          icon={<CheckCircle className="h-4 w-4" />}
          value={totalCheckins}
          label={t("common:thisMonth")}
        />
        <StatsCard
          icon={<Calendar className="h-4 w-4" />}
          value={locations.length}
          label={t("common:locations")}
        />
      </div>

      {pending.length > 0 && (
        <PendingApprovals
          items={pending as any}
          isAdmin={true}
          groupId={groupId}
          timezone={timezone}
          currentUserId={profileId}
        />
      )}

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle>{t("trainer:structuredRoutine")}</CardTitle>
          <Button href={`/g/${groupId}/routine/builder`} variant="secondary">
            {t("trainer:buildRoutine")}
          </Button>
        </div>
        <p className="text-xs text-muted">{t("trainer:structuredRoutineDesc")}</p>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("trainer:pdfRoutine")}</CardTitle>
            {routineName && <CardMeta>{routineName}</CardMeta>}
          </div>
          {routineDeadline && !hasExpiredRoutine && (
            <CountdownBadge deadline={routineDeadline} />
          )}
          {hasExpiredRoutine && (
            <span className="rounded-full bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger">
              {t("common:expired")}
            </span>
          )}
        </div>

        {hasExpiredRoutine && (
          <div className="rounded-xl border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
            {t("trainer:routineExpiredHint")}
          </div>
        )}

        <RoutineUploader
          groupId={groupId}
          currentUrl={routineSignedUrl}
          contentType={routineContentType}
          currentName={routineName}
          currentDeadline={routineDeadline}
        />
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle>{t("trainer:membersTitle")}</CardTitle>
          <span className="text-xs text-muted">{members.length} {t("common:total")}</span>
        </div>

        <div className="space-y-2">
          {members.map((m) => {
            const isTrainer = m.user_id === profileId;
            const checkinCount = memberCheckins.get(m.user_id) ?? 0;

            return (
              <div
                key={m.user_id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-card2 p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={m.users?.avatar_url ?? null}
                    name={m.users?.name ?? undefined}
                    size="sm"
                    showTrainerBadge={isTrainer}
                  />
                  <div>
                    <p className="text-sm font-medium text-text">
                      {m.users?.name ?? t("common:unknown")}
                      {isTrainer && (
                        <span className="ml-1.5 text-xs text-muted">({t("common:you")})</span>
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      {t("common:joined")}{" "}
                      {formatDateDay(m.joined_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-text">{checkinCount}</p>
                  <p className="text-xs text-muted">{t("trainer:thisMonth")}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <InviteLinkCard groupId={groupId} />

      <Card className="space-y-3">
        <CardTitle>{t("common:settings")}</CardTitle>
        <div className="space-y-2 text-sm text-muted">
          <p>
            <span className="text-text">{t("trainer:timezoneLabel")}</span> {timezone}
          </p>
          {groupDescription && (
            <p>
              <span className="text-text">{t("trainer:descriptionLabel")}</span> {groupDescription}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            href={`/g/${groupId}/locations`}
            variant="secondary"
            className="flex-1"
          >
            {t("trainer:manageLocations")}
          </Button>
          <Button href={`/g/${groupId}`} variant="secondary" className="flex-1">
            {t("trainer:viewDashboard")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
