"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const [loading, setLoading] = useState(false);

  const handleLeave = async () => {
    if (isAdmin && memberCount > 1) {
      push({
        type: "error",
        message: "Admins cannot leave groups with other members. Transfer admin role first or remove other members."
      });
      return;
    }

    const confirmed = window.confirm(
      isAdmin && memberCount === 1
        ? "You are the only member. Leaving will delete this group and all its data. Continue?"
        : "Are you sure you want to leave this group?"
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

      push({ type: "success", message: "You have left the group." });
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
      {loading ? "Leaving..." : "Leave Group"}
    </Button>
  );
}
