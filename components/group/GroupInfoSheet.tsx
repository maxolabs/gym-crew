"use client";

import { useTranslation } from "react-i18next";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { InviteLinkCard } from "./InviteLinkCard";
import { LeaveGroupButton } from "./LeaveGroupButton";

type Member = {
  user_id: string;
  role: string;
  users: { name: string; avatar_url: string | null } | null;
};

type Location = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
};

export function GroupInfoSheet({
  open,
  onClose,
  groupId,
  groupName,
  description,
  timezone,
  members,
  locations,
  isAdmin,
  userId
}: {
  open: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  description: string | null;
  timezone: string;
  members: Member[];
  locations: Location[];
  isAdmin: boolean;
  userId: string;
}) {
  const { t } = useTranslation(["groups", "common"]);

  return (
    <Sheet open={open} onClose={onClose} title={t("groups:groupInfo")}>
      {description ? (
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-muted">{t("groups:about")}</h3>
          <p className="text-sm">{description}</p>
          <p className="text-xs text-muted">{t("groups:timezoneLabel", { tz: timezone })}</p>
        </div>
      ) : (
        <p className="text-xs text-muted">{t("groups:timezoneLabel", { tz: timezone })}</p>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted">
            {t("groups:members", { count: members.length })}
          </h3>
        </div>
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.user_id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-card2 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {m.users?.name ?? m.user_id}
                </p>
                <p className="text-xs text-muted">{m.role}</p>
              </div>
              {m.user_id === userId ? (
                <span className="text-xs text-muted">{t("common:you")}</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted">
            {t("common:locations")} ({locations.length})
          </h3>
          {isAdmin ? (
            <Button
              href={`/g/${groupId}/locations`}
              variant="secondary"
              className="text-xs"
            >
              {t("common:manage")}
            </Button>
          ) : null}
        </div>
        {locations.length ? (
          <div className="space-y-2">
            {locations.map((l) => (
              <div
                key={l.id}
                className="rounded-xl border border-white/10 bg-card2 px-3 py-2"
              >
                <p className="text-sm font-semibold">{l.name}</p>
                <p className="text-xs text-muted">
                  {t("groups:radiusLabel", { radius: l.radius_m })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted">
            {t("groups:noLocationsHint")}
          </p>
        )}
      </div>

      {isAdmin ? (
        <InviteLinkCard groupId={groupId} />
      ) : null}

      <div className="pt-2 border-t border-white/10">
        <LeaveGroupButton
          groupId={groupId}
          userId={userId}
          isAdmin={isAdmin}
          memberCount={members.length}
        />
      </div>
    </Sheet>
  );
}
