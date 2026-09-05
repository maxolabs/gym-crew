"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { TopBar } from "@/components/nav/TopBar";
import { Button } from "@/components/ui/Button";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { humanizeError } from "@/lib/errors";

const timezones = Intl.supportedValuesOf?.("timeZone") ?? ["UTC"];

export default function CreateGroupPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const { push } = useToast();
  const { t } = useTranslation(["groups", "common"]);

  const defaultTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC", []);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [timezone, setTimezone] = useState(defaultTz);
  const [routineFile, setRoutineFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-3">
      <TopBar title={t("groups:createGroup")} right={<Button href="/groups" variant="ghost">{t("common:back")}</Button>} />

      <Card className="space-y-4">
        <div>
          <CardTitle>{t("groups:basics")}</CardTitle>
          <CardMeta>{t("groups:basicsHint")}</CardMeta>
        </div>

        <div className="space-y-2">
          <label htmlFor="group-name" className="text-xs text-muted">{t("common:name")}</label>
          <Input id="group-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("groups:groupNamePlaceholder")} />
        </div>

        <div className="space-y-2">
          <label htmlFor="group-description" className="text-xs text-muted">{t("groups:descriptionOptional")}</label>
          <Textarea
            id="group-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("groups:descriptionPlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="group-timezone" className="text-xs text-muted">{t("common:timezone")}</label>
          <select
            id="group-timezone"
            className="h-11 w-full rounded-xl border border-white/10 bg-card2 px-3 text-sm"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="group-routine" className="text-xs text-muted">{t("groups:routineOptional")}</label>
          <input
            id="group-routine"
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            onChange={(e) => setRoutineFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-text"
          />
        </div>

        <Button
          size="lg"
          disabled={loading || !name.trim()}
          onClick={async () => {
            try {
              setLoading(true);
              const { data, error } = await supabase.rpc("create_gym_group", {
                p_name: name.trim(),
                p_description: description.trim() || null,
                p_timezone: timezone
              });
              if (error) throw error;
              const groupId = data as string;
              if (routineFile) {
                const mime = routineFile.type;
                const ext =
                  mime === "application/pdf"
                    ? "pdf"
                    : mime === "image/png"
                      ? "png"
                      : mime === "image/jpeg"
                        ? "jpg"
                        : null;
                if (ext) {
                  const path = `routines/${groupId}/routine.${ext}`;
                  const { error: upErr } = await supabase.storage
                    .from("routines")
                    .upload(path, routineFile, { upsert: true, contentType: mime });
                  if (!upErr) {
                    await supabase
                      .from("gym_groups")
                      .update({ routine_url: path, routine_content_type: mime })
                      .eq("id", groupId);
                  }
                }
              }
              push({ type: "success", message: t("groups:groupCreated") });
              router.replace(`/g/${groupId}`);
            } catch (e: any) {
              push({ type: "error", message: humanizeError(e) });
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? t("auth:creating") : t("groups:createGroup")}
        </Button>
      </Card>
    </div>
  );
}
