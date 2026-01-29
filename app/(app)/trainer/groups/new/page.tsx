"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
        title="Create Group"
        right={
          <Button href="/trainer/groups" variant="ghost">
            Cancel
          </Button>
        }
      />

      <Card className="space-y-4">
        <div>
          <CardTitle>New Group</CardTitle>
          <CardMeta>
            Create a group for your clients. You can add routines and locations
            after.
          </CardMeta>
        </div>

        <div className="space-y-2">
          <label htmlFor="group-name" className="text-xs text-muted">
            Group Name
          </label>
          <Input
            id="group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Morning Bootcamp"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="group-description" className="text-xs text-muted">
            Description (optional)
          </label>
          <Textarea
            id="group-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="6am weekday sessions for accountability"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="group-timezone" className="text-xs text-muted">
            Timezone
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
              push({ type: "success", message: "Group created" });
              router.replace(`/trainer/groups/${groupId}`);
            } catch (e: unknown) {
              push({ type: "error", message: humanizeError(e) });
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "Creating..." : "Create Group"}
        </Button>
      </Card>
    </div>
  );
}
