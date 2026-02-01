"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useToast } from "@/components/ui/Toast";
import { humanizeError } from "@/lib/errors";

function extForMime(mime: string) {
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  return null;
}

function getDefaultDeadline(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 16);
}

type Props = {
  groupId: string;
  currentUrl?: string | null;
  contentType?: string | null;
  currentName?: string | null;
  currentDeadline?: string | null;
};

export function RoutineUploader({
  groupId,
  currentUrl,
  contentType,
  currentName,
  currentDeadline
}: Props) {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const { push } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [routineName, setRoutineName] = useState(currentName ?? "");
  const [deadline, setDeadline] = useState(
    currentDeadline ? currentDeadline.slice(0, 16) : getDefaultDeadline()
  );
  const [busy, setBusy] = useState(false);

  const hasCurrentRoutine = !!currentUrl;
  const isExpired = currentDeadline && new Date(currentDeadline) < new Date();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="routine-name" className="text-xs text-muted">
          Routine Name
        </label>
        <Input
          id="routine-name"
          value={routineName}
          onChange={(e) => setRoutineName(e.target.value)}
          placeholder="Week 1 - Upper Body"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="routine-deadline" className="text-xs text-muted">
          Deadline
        </label>
        <Input
          id="routine-deadline"
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
        <p className="text-xs text-muted">
          Routine will be hidden from clients after this date.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted">
          {hasCurrentRoutine && !isExpired
            ? "Replace routine file (optional)"
            : "Routine file"}
        </label>
        <input
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-text"
        />
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={busy || (!file && !hasCurrentRoutine) || !routineName.trim()}
        onClick={async () => {
          try {
            setBusy(true);

            let uploadPath = currentUrl?.replace(/^routines\//, "") ? currentUrl : null;

            if (file) {
              const ext = extForMime(file.type);
              if (!ext) {
                push({ type: "error", message: "Unsupported file type." });
                return;
              }

              const path = `routines/${groupId}/routine.${ext}`;

              const { error: upErr } = await supabase.storage
                .from("routines")
                .upload(path, file, { upsert: true, contentType: file.type });
              if (upErr) throw upErr;

              uploadPath = path;
            }

            const updateData: Record<string, unknown> = {
              routine_name: routineName.trim(),
              routine_deadline: new Date(deadline).toISOString()
            };

            if (file && uploadPath) {
              updateData.routine_url = uploadPath;
              updateData.routine_content_type = file.type;
            }

            const { error: dbErr } = await supabase
              .from("gym_groups")
              .update(updateData)
              .eq("id", groupId);
            if (dbErr) throw dbErr;

            push({ type: "success", message: "Routine updated." });
            router.refresh();
          } catch (e: unknown) {
            push({ type: "error", message: humanizeError(e) });
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Saving..." : hasCurrentRoutine && !isExpired ? "Update Routine" : "Upload Routine"}
      </Button>
    </div>
  );
}

