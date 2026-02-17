import { requireUserProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { TopBar } from "@/components/nav/TopBar";
import { Card, CardTitle } from "@/components/ui/Card";
import { AchievementsGrid } from "@/components/achievements/AchievementsGrid";
import { LevelBadge, XPProgressBar } from "@/components/xp";
import type { AchievementDefinition } from "@/lib/achievements/types";

export default async function AchievementsPage() {
  const profile = await requireUserProfile();
  const supabase = await supabaseServer();

  // Fetch all achievement definitions
  const { data: definitions } = await supabase
    .from("achievement_definitions")
    .select("*")
    .order("rarity", { ascending: false });

  // Fetch user's earned achievements and level info in parallel
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
    <div className="space-y-4">
      <TopBar title="Achievements" />

      {/* Level Progress Card */}
      <Card className="space-y-3">
        <div className="flex items-center gap-4">
          <LevelBadge
            level={level.current_level}
            title={level.level_title}
            color={level.level_color}
            size="lg"
          />
          <div className="flex-1">
            <XPProgressBar
              currentXP={level.total_xp}
              currentLevel={level.current_level}
              levelTitle={level.level_title}
              levelColor={level.level_color}
              xpForCurrentLevel={level.xp_for_current_level}
              xpForNextLevel={level.xp_for_next_level}
              progressPercent={level.progress_percent}
            />
          </div>
        </div>
      </Card>

      {/* Achievements Grid */}
      <Card>
        <CardTitle className="mb-4">All Achievements</CardTitle>
        <AchievementsGrid
          definitions={(definitions ?? []) as AchievementDefinition[]}
          earnedIds={earnedIds}
        />
      </Card>
    </div>
  );
}
