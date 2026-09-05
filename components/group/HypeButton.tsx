"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useToast } from "@/components/ui/Toast";
import { HYPE_EMOJI, HYPE_ACHIEVEMENT_THRESHOLDS } from "@/lib/hype-config";
import { cn } from "@/lib/cn";

type Props = {
  checkInId: string;
  checkInUserId: string;
  currentUserId: string;
  initialCount: number;
  initialHyped: boolean;
};

export function HypeButton({
  checkInId,
  checkInUserId,
  currentUserId,
  initialCount,
  initialHyped,
}: Props) {
  const supabase = supabaseBrowser();
  const { push, pushAchievement } = useToast();
  const { t } = useTranslation("groups");

  const [count, setCount] = useState(initialCount);
  const [hyped, setHyped] = useState(initialHyped);
  const [animating, setAnimating] = useState(false);

  const isOwn = checkInUserId === currentUserId;

  const handleHype = async () => {
    if (isOwn || hyped) return;

    // Optimistic update
    setHyped(true);
    setCount((c) => c + 1);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);

    try {
      const { data, error } = await supabase.rpc("send_hype", {
        p_check_in_id: checkInId,
      });

      if (error) throw error;

      const result = (data as any)?.[0];
      if (result) {
        setCount(Number(result.hype_count));
      }

      // Check hype achievements
      const { count: totalSent } = await supabase
        .from("hypes")
        .select("id", { count: "exact", head: true })
        .eq("from_user_id", currentUserId);

      if (totalSent != null) {
        for (const threshold of HYPE_ACHIEVEMENT_THRESHOLDS) {
          if (totalSent === threshold.count) {
            const { data: achData } = await supabase.rpc("award_achievement", {
              p_user_id: currentUserId,
              p_slug: threshold.slug,
              p_group_id: null,
              p_metadata: {},
            });

            const achResult = (achData as any)?.[0];
            if (achResult?.awarded) {
              pushAchievement({
                name: achResult.achievement_name,
                description: achResult.achievement_description,
                icon: achResult.achievement_icon,
                rarity: achResult.achievement_rarity,
                xp: achResult.achievement_xp,
              });
            }
            break;
          }
        }
      }
    } catch {
      // Revert optimistic update
      setHyped(false);
      setCount((c) => c - 1);
      push({ type: "error", message: t("failedHype") });
    }
  };

  return (
    <button
      onClick={handleHype}
      disabled={isOwn}
      className={cn(
        "flex items-center gap-1 rounded-lg border px-2 py-1 text-sm transition-all",
        hyped
          ? "border-red-500/30 bg-red-500/10 text-red-400"
          : isOwn
            ? "cursor-default border-white/5 bg-white/5 text-muted/50"
            : "border-white/10 bg-white/5 text-muted hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400",
        animating && "scale-110"
      )}
    >
      <span className={cn("transition-transform", animating && "scale-125")}>
        {HYPE_EMOJI}
      </span>
      {count > 0 && <span className="font-medium">{count}</span>}
    </button>
  );
}
