"use client";

import { useState } from "react";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useToast } from "@/components/ui/Toast";
import { humanizeError } from "@/lib/errors";

export function InviteLinkCard({ groupId }: { groupId: string }) {
  const supabase = supabaseBrowser();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  return (
    <Card className="space-y-3">
      <div>
        <CardTitle>Invite friends</CardTitle>
        <CardMeta>Generate a join link and share it.</CardMeta>
      </div>

      {link ? (
        <div className="rounded-xl border border-white/10 bg-card2 px-3 py-3">
          <p className="break-all text-xs">{link}</p>
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button
          variant="secondary"
          disabled={loading}
          onClick={async () => {
            try {
              setLoading(true);
              const { data, error } = await supabase.rpc("create_group_invite", {
                p_group_id: groupId,
                p_expires_in_hours: 168,
                p_max_uses: 50
              });
              if (error) throw error;
              const token = data as string;
              const url = `${window.location.origin}/join/${token}`;
              setLink(url);

              if (navigator.share) {
                await navigator.share({
                  title: "Gym Crew invite",
                  text: "Join our Gym Crew group:",
                  url
                });
              } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(url);
                push({ type: "success", message: "Invite link copied." });
              }
            } catch (e: any) {
              push({ type: "error", message: humanizeError(e) });
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "Creating..." : link ? "New link" : "Create link"}
        </Button>
        {link ? (
          <Button
            variant="ghost"
            disabled={loading}
            onClick={async () => {
              try {
                if (!navigator.clipboard) {
                  push({ type: "info", message: "Clipboard not available on this device." });
                  return;
                }
                await navigator.clipboard.writeText(link);
                push({ type: "success", message: "Copied." });
              } catch (e: any) {
                push({ type: "error", message: e?.message ?? "Copy failed" });
              }
            }}
          >
            Copy
          </Button>
        ) : null}
      </div>
    </Card>
  );
}



