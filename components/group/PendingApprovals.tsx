"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useToast } from "@/components/ui/Toast";
import { humanizeError } from "@/lib/errors";
import { getStreakForUser } from "@/lib/achievements";
import { getXPForCheckIn, XP_REWARDS } from "@/lib/xp-config";

type Pending = {
  id: string;
  user_id: string;
  checkin_date: string;
  created_at: string;
  users?: { name: string | null } | null;
};

export function PendingApprovals({
  items,
  isAdmin,
  groupId,
  timezone,
  currentUserId
}: {
  items: Pending[];
  isAdmin: boolean;
  groupId: string;
  timezone: string;
  currentUserId: string;
}) {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const { push, pushXPGain } = useToast();
  const { t } = useTranslation(["groups", "common"]);

  const [busyId, setBusyId] = useState<string | null>(null);

  if (!items.length) {
    return (
      <Card className="space-y-2">
        <CardTitle>{t("groups:manualApprovals")}</CardTitle>
        <CardMeta>{t("groups:noPending")}</CardMeta>
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <div>
        <CardTitle>{t("groups:manualApprovals")}</CardTitle>
        <CardMeta>{t("groups:anyMemberCanApprove")}</CardMeta>
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
                <p className="text-xs text-muted">{t("groups:dateLabel", { date: x.checkin_date })}</p>
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

                      (async () => {
                        try {
                          const streak = await getStreakForUser(supabase, x.user_id, groupId, timezone);
                          const xpInfo = getXPForCheckIn("MANUAL", streak);
                          await supabase.rpc("award_xp", {
                            p_user_id: x.user_id,
                            p_amount: xpInfo.baseXP,
                            p_source: "checkin",
                            p_source_id: x.id,
                            p_multiplier: xpInfo.multiplier
                          });
                        } catch (err) {
                          console.error("Failed to award XP to approved user:", err);
                        }
                      })();

                      (async () => {
                        try {
                          await supabase.rpc("award_xp", {
                            p_user_id: currentUserId,
                            p_amount: XP_REWARDS.APPROVE_CHECKIN,
                            p_source: "approval",
                            p_source_id: x.id,
                            p_multiplier: 1.0
                          });
                          pushXPGain({ amount: XP_REWARDS.APPROVE_CHECKIN });
                        } catch (err) {
                          console.error("Failed to award XP to approver:", err);
                        }
                      })();

                      push({ type: "success", message: t("groups:approved") });
                      router.refresh();
                    } catch (e: any) {
                      push({ type: "error", message: humanizeError(e) });
                    } finally {
                      setBusyId(null);
                    }
                  }}
                >
                  {t("common:approve")}
                </Button>
                {isAdmin ? (
                  <Button
                    variant="danger"
                    className="h-10 px-3 text-xs"
                    disabled={busyId === x.id}
                    onClick={async () => {
                      try {
                        const reason = window.prompt(t("groups:reasonPrompt")) ?? "";
                        setBusyId(x.id);
                        const { error } = await supabase.rpc("reject_manual_checkin", {
                          p_check_in_id: x.id,
                          p_reason: reason
                        });
                        if (error) throw error;
                        push({ type: "success", message: t("groups:rejected") });
                        router.refresh();
                      } catch (e: any) {
                        push({ type: "error", message: humanizeError(e) });
                      } finally {
                        setBusyId(null);
                      }
                    }}
                  >
                    {t("common:reject")}
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
