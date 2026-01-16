"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useToast } from "@/components/ui/Toast";
import { humanizeError } from "@/lib/errors";

type Pending = {
  id: string;
  user_id: string;
  checkin_date: string;
  created_at: string;
  users?: { name: string | null } | null;
};

export function PendingApprovals({
  items,
  isAdmin
}: {
  items: Pending[];
  isAdmin: boolean;
}) {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const { push } = useToast();

  const [busyId, setBusyId] = useState<string | null>(null);

  if (!items.length) {
    return (
      <Card className="space-y-2">
        <CardTitle>Manual approvals</CardTitle>
        <CardMeta>No pending requests.</CardMeta>
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <div>
        <CardTitle>Manual approvals</CardTitle>
        <CardMeta>Any other member can approve. Admins can reject.</CardMeta>
      </div>
      <div className="space-y-2">
        {items.map((x) => (
          <div
            key={x.id}
            className="rounded-xl border border-white/10 bg-card2 px-3 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {x.users?.name ?? x.user_id}
                </p>
                <p className="text-xs text-muted">Date: {x.checkin_date}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  className="h-10 px-3 text-xs"
                  disabled={busyId === x.id}
                  onClick={async () => {
                    try {
                      setBusyId(x.id);
                      const { error } = await supabase.rpc("approve_manual_checkin", {
                        p_check_in_id: x.id
                      });
                      if (error) throw error;
                      push({ type: "success", message: "Approved." });
                      router.refresh();
                    } catch (e: any) {
                      push({ type: "error", message: humanizeError(e) });
                    } finally {
                      setBusyId(null);
                    }
                  }}
                >
                  Approve
                </Button>
                {isAdmin ? (
                  <Button
                    variant="danger"
                    className="h-10 px-3 text-xs"
                    disabled={busyId === x.id}
                    onClick={async () => {
                      try {
                        const reason = window.prompt("Reason (optional)?") ?? "";
                        setBusyId(x.id);
                        const { error } = await supabase.rpc("reject_manual_checkin", {
                          p_check_in_id: x.id,
                          p_reason: reason
                        });
                        if (error) throw error;
                        push({ type: "success", message: "Rejected." });
                        router.refresh();
                      } catch (e: any) {
                        push({ type: "error", message: humanizeError(e) });
                      } finally {
                        setBusyId(null);
                      }
                    }}
                  >
                    Reject
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}



