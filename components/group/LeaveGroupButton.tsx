"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useToast } from "@/components/ui/Toast";
import { humanizeError } from "@/lib/errors";

type Props = {
  groupId: string;
  userId: string;
  isAdmin: boolean;
  memberCount: number;
};

export function LeaveGroupButton({ groupId, userId, isAdmin, memberCount }: Props) {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const { push } = useToast();
  const { t } = useTranslation("groups");
  const [loading, setLoading] = useState(false);

  const handleLeave = async () => {
    if (isAdmin && memberCount > 1) {
      push({
        type: "error",
        message: t("adminCantLeave")
      });
      return;
    }

    const confirmed = window.confirm(
      isAdmin && memberCount === 1
        ? t("onlyMemberWarning")
        : t("leaveConfirm")
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", userId);

      if (error) throw error;

      push({ type: "success", message: t("leftGroup") });
      router.replace("/groups");
      router.refresh();
    } catch (e: any) {
      push({ type: "error", message: humanizeError(e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="danger"
      className="h-10 px-3 text-xs"
      disabled={loading}
      onClick={handleLeave}
    >
      {loading ? t("leaving") : t("leaveGroup")}
    </Button>
  );
}
