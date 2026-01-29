"use client";

import { useState } from "react";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ImageViewer } from "@/components/ui/ImageViewer";
import { CountdownBadge } from "@/components/ui/CountdownBadge";
import { AlertTriangle } from "lucide-react";

type Props = {
  groupId: string;
  routineUrl: string | null;
  contentType: string | null;
  routineName?: string | null;
  routineDeadline?: string | null;
  isAdmin: boolean;
};

export function RoutineCard({
  groupId,
  routineUrl,
  contentType,
  routineName,
  routineDeadline,
  isAdmin
}: Props) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const isImage = contentType && !contentType.includes("pdf");

  const isExpired = routineDeadline && new Date(routineDeadline) < new Date();
  const hasActiveRoutine = routineUrl && !isExpired;

  if (isExpired && !isAdmin) {
    return null;
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <CardTitle>{routineName || "Routine"}</CardTitle>
          {routineDeadline && !isExpired && (
            <div className="mt-1">
              <CountdownBadge deadline={routineDeadline} />
            </div>
          )}
          {!routineUrl && !isExpired && (
            <CardMeta>No routine uploaded yet.</CardMeta>
          )}
        </div>
        {isAdmin && (
          <Button href={`/g/${groupId}/routine`} variant="secondary">
            {routineUrl ? "Manage" : "Upload"}
          </Button>
        )}
      </div>

      {isExpired && isAdmin && (
        <div className="flex items-start gap-3 rounded-xl border border-danger/20 bg-danger/5 p-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
          <div>
            <p className="text-sm font-medium text-danger">Routine Expired</p>
            <p className="text-xs text-muted">
              This routine is no longer visible to clients. Upload a new one to continue.
            </p>
          </div>
        </div>
      )}

      {!routineUrl && !isExpired && (
        <div className="rounded-xl border border-white/10 bg-card2 px-3 py-3">
          <p className="text-sm font-semibold">No routine uploaded</p>
          <p className="text-xs text-muted">
            {isAdmin
              ? "Upload a PDF/image so members can follow the plan."
              : "Ask your trainer to upload the routine."}
          </p>
        </div>
      )}

      {hasActiveRoutine && contentType?.includes("pdf") && (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
            <iframe
              title="Routine PDF"
              src={routineUrl}
              className="h-[420px] w-full"
            />
          </div>
          <Button href={routineUrl} variant="ghost" className="h-10 px-0 text-sm">
            Download / Open
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
            <img src={routineUrl} alt="Gym routine" className="h-auto w-full" />
          </button>
          <p className="text-center text-xs text-muted">Tap image to zoom</p>
          <Button href={routineUrl} variant="ghost" className="h-10 px-0 text-sm">
            Download / Open
          </Button>
        </div>
      )}

      {isImage && routineUrl && (
        <ImageViewer
          src={routineUrl}
          alt="Gym routine"
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </Card>
  );
}
