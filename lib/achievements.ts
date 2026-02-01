import type { SupabaseClient } from "@supabase/supabase-js";
import type { AchievementDefinition, AwardedAchievement, CheckInContext, AchievementRarity } from "./achievements/types";

export type { AchievementDefinition, AwardedAchievement, CheckInContext, AchievementRarity };

type AwardResult = {
  awarded: boolean;
  achievement_id: string | null;
  achievement_name: string | null;
  achievement_description: string | null;
  achievement_icon: string | null;
  achievement_rarity: AchievementRarity | null;
  achievement_xp: number | null;
};

export async function checkAndAwardAchievements(
  supabase: SupabaseClient,
  userId: string,
  groupId: string,
  context: CheckInContext
): Promise<AwardedAchievement[]> {
  // Fetch all achievement definitions
  const { data: definitions } = await supabase
    .from("achievement_definitions")
    .select("*");

  if (!definitions?.length) return [];

  // Fetch user's existing achievements
  const { data: earned } = await supabase
    .from("user_achievements")
    .select("achievement_id, group_id")
    .eq("user_id", userId);

  const earnedSet = new Set(
    (earned ?? []).map((e) => `${e.achievement_id}:${e.group_id ?? "global"}`)
  );

  const awarded: AwardedAchievement[] = [];

  for (const def of definitions as AchievementDefinition[]) {
    const key = `${def.id}:${groupId}`;
    const globalKey = `${def.id}:global`;

    // Skip if already earned (either for this group or globally)
    if (earnedSet.has(key) || earnedSet.has(globalKey)) continue;

    const shouldAward = evaluateAchievement(def, context);
    if (!shouldAward) continue;

    // Award via RPC
    const { data } = await supabase.rpc("award_achievement", {
      p_user_id: userId,
      p_slug: def.slug,
      p_group_id: groupId,
      p_metadata: {}
    });

    const result = (data as AwardResult[] | null)?.[0];
    if (result?.awarded) {
      awarded.push({
        id: result.achievement_id!,
        name: result.achievement_name!,
        description: result.achievement_description!,
        icon: result.achievement_icon!,
        rarity: result.achievement_rarity!,
        xp: result.achievement_xp!
      });
    }
  }

  return awarded;
}

function evaluateAchievement(def: AchievementDefinition, context: CheckInContext): boolean {
  const { requirement_type, requirement_value } = def;
  const value = requirement_value as Record<string, number | string>;

  switch (requirement_type) {
    case "STREAK_DAYS": {
      const required = value.days as number;
      return context.currentStreak >= required;
    }

    case "TOTAL_CHECKINS": {
      const required = value.count as number;
      return context.totalCheckIns >= required;
    }

    case "TIME_WINDOW": {
      const hour = context.checkInTime.getHours();
      if (value.before_hour !== undefined) {
        return hour < (value.before_hour as number);
      }
      if (value.after_hour !== undefined) {
        return hour >= (value.after_hour as number);
      }
      return false;
    }

    case "EVENT": {
      const event = value.event as string;
      if (event === "first_checkin") {
        return context.isFirstCheckIn;
      }
      // group_join is handled separately when joining groups
      return false;
    }

    // WEEKEND_CHECKIN, PERFECT_WEEK, PERFECT_MONTH require historical data
    // These would need additional context or separate batch processing
    case "WEEKEND_CHECKIN":
    case "PERFECT_WEEK":
    case "PERFECT_MONTH":
      return false;

    default:
      return false;
  }
}

export async function getStreakForUser(
  supabase: SupabaseClient,
  userId: string,
  groupId: string,
  timezone: string
): Promise<number> {
  // Get all approved check-ins for this user in this group, ordered by date desc
  const { data: checkIns } = await supabase
    .from("check_ins")
    .select("checkin_date")
    .eq("user_id", userId)
    .eq("group_id", groupId)
    .eq("status", "APPROVED")
    .order("checkin_date", { ascending: false });

  if (!checkIns?.length) return 0;

  // Calculate streak
  let streak = 0;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: timezone });
  const todayDate = new Date(today);

  for (let i = 0; i < checkIns.length; i++) {
    const checkInDate = new Date(checkIns[i].checkin_date);
    const expectedDate = new Date(todayDate);
    expectedDate.setDate(expectedDate.getDate() - i);

    if (checkInDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else if (i === 0) {
      // If today is not checked in, check if yesterday was the start
      const yesterday = new Date(todayDate);
      yesterday.setDate(yesterday.getDate() - 1);
      if (checkInDate.getTime() === yesterday.getTime()) {
        streak++;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return streak;
}

export async function getTotalCheckInsForUser(
  supabase: SupabaseClient,
  userId: string,
  groupId: string
): Promise<number> {
  const { count } = await supabase
    .from("check_ins")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("group_id", groupId)
    .eq("status", "APPROVED");

  return count ?? 0;
}
