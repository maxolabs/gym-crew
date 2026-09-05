import { requireUserProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { AchievementsContent } from "@/components/achievements/AchievementsContent";
import type { AchievementDefinition } from "@/lib/achievements/types";

export default async function AchievementsPage() {
  const profile = await requireUserProfile();
  const supabase = await supabaseServer();

  const { data: definitions } = await supabase
    .from("achievement_definitions")
    .select("*")
    .order("rarity", { ascending: false });

  const [{ data: earned }, { data: levelData }] = await Promise.all([
    supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", profile.id),
    supabase.rpc("get_user_level_info", { p_user_id: profile.id })
  ]);

  const level = (levelData as any)?.[0] ?? {
    total_xp: 0,
    current_level: 1,
    level_title: "Newcomer",
    level_color: "#6B7280",
    xp_for_current_level: 0,
    xp_for_next_level: 100,
    progress_percent: 0
  };
  const earnedIds = new Set((earned ?? []).map((e) => e.achievement_id));

  return (
    <AchievementsContent
      definitions={(definitions ?? []) as AchievementDefinition[]}
      earnedIds={earnedIds}
      level={level}
    />
  );
}
