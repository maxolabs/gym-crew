"use client";

import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function RoutineCard({
  groupId,
  routineUrl,
  contentType,
  isAdmin
}: {
  groupId: string;
  routineUrl: string | null;
  contentType: string | null;
  isAdmin: boolean;
}) {
  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>Routine</CardTitle>
          <CardMeta>PDF or image. View inline or download.</CardMeta>
        </div>
        {isAdmin ? (
          <Button href={`/g/${groupId}/routine`} variant="secondary">
            {routineUrl ? "Replace" : "Upload"}
          </Button>
        ) : null}
      </div>

      {!routineUrl ? (
        <div className="rounded-xl border border-white/10 bg-card2 px-3 py-3">
          <p className="text-sm font-semibold">No routine uploaded</p>
          <p className="text-xs text-muted">
            {isAdmin
              ? "Upload a PDF/image so members can follow the plan."
              : "Ask an admin to upload the routine."}
          </p>
        </div>
      ) : contentType?.includes("pdf") ? (
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
      ) : (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={routineUrl} alt="Gym routine" className="h-auto w-full" />
          </div>
          <Button href={routineUrl} variant="ghost" className="h-10 px-0 text-sm">
            Download / Open
          </Button>
        </div>
      )}
    </Card>
  );
}



