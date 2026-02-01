import { requireUserProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { TopBar } from "@/components/nav/TopBar";
import { Card, CardTitle } from "@/components/ui/Card";
import { AchievementsGrid } from "@/components/achievements/AchievementsGrid";
import { Trophy } from "lucide-react";
import type { AchievementDefinition } from "@/lib/achievements/types";

// XP thresholds for levels
const LEVELS = [
  { level: 1, xp: 0 },
  { level: 2, xp: 100 },
  { level: 3, xp: 250 },
  { level: 4, xp: 500 },
  { level: 5, xp: 850 },
  { level: 6, xp: 1300 },
  { level: 7, xp: 1850 },
  { level: 8, xp: 2500 },
  { level: 9, xp: 3300 },
  { level: 10, xp: 4250 }
];

function calculateLevel(xp: number): { level: number; currentXp: number; nextXp: number; progress: number } {
  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1];

  for (let i = 0; i < LEVELS.length - 1; i++) {
    if (xp >= LEVELS[i].xp) {
      currentLevel = LEVELS[i];
      nextLevel = LEVELS[i + 1];
    }
  }

  // Max level
  if (xp >= LEVELS[LEVELS.length - 1].xp) {
    return {
      level: LEVELS[LEVELS.length - 1].level,
      currentXp: xp,
      nextXp: LEVELS[LEVELS.length - 1].xp,
      progress: 100
    };
  }

  const xpInLevel = xp - currentLevel.xp;
  const xpForLevel = nextLevel.xp - currentLevel.xp;
  const progress = Math.round((xpInLevel / xpForLevel) * 100);

  return {
    level: currentLevel.level,
    currentXp: xp,
    nextXp: nextLevel.xp,
    progress
  };
}

export default async function AchievementsPage() {
  const profile = await requireUserProfile();
  const supabase = await supabaseServer();

  // Fetch all achievement definitions
  const { data: definitions } = await supabase
    .from("achievement_definitions")
    .select("*")
    .order("rarity", { ascending: false });

  // Fetch user's earned achievements
  const { data: earned } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", profile.id);

  // Get total XP
  const { data: xpData } = await supabase.rpc("get_user_achievement_xp", {
    p_user_id: profile.id
  });

  const totalXp = (xpData as number) ?? 0;
  const levelInfo = calculateLevel(totalXp);
  const earnedIds = new Set((earned ?? []).map((e) => e.achievement_id));

  return (
    <div className="space-y-4">
      <TopBar title="Achievements" />

      {/* XP Summary Card */}
      <Card className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Trophy className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">Level {levelInfo.level}</span>
              <span className="text-sm text-muted">{totalXp} XP</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${levelInfo.progress}%` }}
              />
            </div>
            {levelInfo.level < 10 && (
              <p className="mt-1 text-xs text-muted">
                {levelInfo.nextXp - levelInfo.currentXp} XP to Level {levelInfo.level + 1}
              </p>
            )}
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
