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
  const { t } = useTranslation(["trainer", "common"]);

  const defaultTz = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
    []
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [timezone, setTimezone] = useState(defaultTz);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-3">
      <TopBar
        title={t("trainer:createGroup")}
        right={
          <Button href="/trainer/groups" variant="ghost">
            {t("common:cancel")}
          </Button>
        }
      />

      <Card className="space-y-4">
        <div>
          <CardTitle>{t("trainer:newGroupTitle")}</CardTitle>
          <CardMeta>
            {t("trainer:newGroupDesc")}
          </CardMeta>
        </div>

        <div className="space-y-2">
          <label htmlFor="group-name" className="text-xs text-muted">
            {t("trainer:groupName")}
          </label>
          <Input
            id="group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("trainer:groupNamePlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="group-description" className="text-xs text-muted">
            {t("trainer:descriptionOptional")}
          </label>
          <Textarea
            id="group-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("trainer:descriptionPlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="group-timezone" className="text-xs text-muted">
            {t("common:timezone")}
          </label>
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
              push({ type: "success", message: t("groups:groupCreated") });
              router.replace(`/trainer/groups/${groupId}`);
            } catch (e: unknown) {
              push({ type: "error", message: humanizeError(e) });
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? t("auth:creating") : t("trainer:createGroup")}
        </Button>
      </Card>
    </div>
  );
}
