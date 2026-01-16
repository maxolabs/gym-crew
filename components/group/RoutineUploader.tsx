"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useToast } from "@/components/ui/Toast";
import { humanizeError } from "@/lib/errors";

function extForMime(mime: string) {
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  return null;
}

export function RoutineUploader({
  groupId,
  existingPath
}: {
  groupId: string;
  existingPath: string | null;
}) {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const { push } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Card className="space-y-3">
      <div>
        <CardTitle>{existingPath ? "Replace routine" : "Upload routine"}</CardTitle>
        <CardMeta>PDF or PNG/JPEG. Stored in Supabase Storage.</CardMeta>
      </div>

      <input
        type="file"
        accept="application/pdf,image/png,image/jpeg"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="block w-full text-sm text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-text"
      />

      <Button
        size="lg"
        disabled={busy || !file}
        onClick={async () => {
          if (!file) return;
          const ext = extForMime(file.type);
          if (!ext) {
            push({ type: "error", message: "Unsupported file type." });
            return;
          }

          try {
            setBusy(true);
            const path = `routines/${groupId}/routine.${ext}`;

            const { error: upErr } = await supabase.storage
              .from("routines")
              .upload(path, file, { upsert: true, contentType: file.type });
            if (upErr) throw upErr;

            const { error: dbErr } = await supabase
              .from("gym_groups")
              .update({ routine_url: path, routine_content_type: file.type })
              .eq("id", groupId);
            if (dbErr) throw dbErr;

            push({ type: "success", message: "Routine uploaded." });
            router.replace(`/g/${groupId}`);
            router.refresh();
          } catch (e: any) {
            push({ type: "error", message: humanizeError(e) });
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Uploading..." : "Upload"}
      </Button>
    </Card>
  );
}



