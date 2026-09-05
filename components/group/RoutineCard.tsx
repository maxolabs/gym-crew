"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ImageViewer } from "@/components/ui/ImageViewer";
import { CountdownBadge } from "@/components/ui/CountdownBadge";
import { AlertTriangle, Dumbbell } from "lucide-react";
import { SessionView } from "@/components/routine/SessionView";
import type { ActiveRoutine } from "@/lib/routine";

type Props = {
  groupId: string;
  routineUrl: string | null;
  contentType: string | null;
  routineName?: string | null;
  routineDeadline?: string | null;
  isAdmin: boolean;
  structuredRoutine?: ActiveRoutine | null;
};

export function RoutineCard({
  groupId,
  routineUrl,
  contentType,
  routineName,
  routineDeadline,
  isAdmin,
  structuredRoutine
}: Props) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const { t } = useTranslation(["groups", "common"]);
  const isImage = contentType && !contentType.includes("pdf");

  const isExpired = routineDeadline && new Date(routineDeadline) < new Date();
  const hasActiveRoutine = routineUrl && !isExpired;

  if (isExpired && !isAdmin && !structuredRoutine) {
    return null;
  }

  // If there's a structured routine, show that instead of/alongside PDF
  if (structuredRoutine && structuredRoutine.days.length > 0) {
    return (
      <Card className="space-y-3">
        <SessionView routine={structuredRoutine} groupId={groupId} isAdmin={isAdmin} />
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <CardTitle>{routineName || t("common:routine")}</CardTitle>
          {routineDeadline && !isExpired && (
            <div className="mt-1">
              <CountdownBadge deadline={routineDeadline} />
            </div>
          )}
          {!routineUrl && !isExpired && (
            <CardMeta>{t("groups:noRoutineYet")}</CardMeta>
          )}
        </div>
        {isAdmin && (
          <Button href={`/g/${groupId}/routine`} variant="secondary">
            {routineUrl ? t("common:manage") : t("common:upload")}
          </Button>
        )}
      </div>

      {isExpired && isAdmin && (
        <div className="flex items-start gap-3 rounded-xl border border-danger/20 bg-danger/5 p-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
          <div>
            <p className="text-sm font-medium text-danger">{t("groups:routineExpired")}</p>
            <p className="text-xs text-muted">
              {t("groups:routineExpiredDesc")}
            </p>
          </div>
        </div>
      )}

      {!routineUrl && !isExpired && (
        <div className="rounded-xl border border-white/10 bg-card2 px-3 py-3">
          <p className="text-sm font-semibold">{t("groups:noRoutineUploaded")}</p>
          <p className="text-xs text-muted">
            {isAdmin
              ? t("groups:uploadRoutineAdmin")
              : t("groups:uploadRoutineClient")}
          </p>
        </div>
      )}

      {hasActiveRoutine && contentType?.includes("pdf") && (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
            <iframe
              title={t("groups:routinePdf")}
              src={routineUrl}
              className="h-[420px] w-full"
            />
          </div>
          <Button href={routineUrl} variant="ghost" className="h-10 px-0 text-sm">
            {t("groups:downloadOpen")}
          </Button>
        </div>
      )}

      {hasActiveRoutine && isImage && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setViewerOpen(true)}
            className="w-full cursor-zoom-in overflow-hidden rounded-xl border border-white/10 bg-black"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={routineUrl} alt={t("groups:gymRoutineAlt")} className="h-auto w-full" />
          </button>
          <p className="text-center text-xs text-muted">{t("groups:tapToZoom")}</p>
          <Button href={routineUrl} variant="ghost" className="h-10 px-0 text-sm">
            {t("groups:downloadOpen")}
          </Button>
        </div>
      )}

      {isImage && routineUrl && (
        <ImageViewer
          src={routineUrl}
          alt={t("groups:gymRoutineAlt")}
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </Card>
  );
}
