import { requireUserProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { ProfileContent } from "@/components/profile/ProfileContent";

export default async function ProfilePage() {
  const profile = await requireUserProfile();
  const supabase = await supabaseServer();

  const [{ count: groupCount }, { count: totalApproved }] = await Promise.all([
    supabase
      .from("group_members")
      .select("group_id", { count: "exact", head: true })
      .eq("user_id", profile.id),
    supabase
      .from("check_ins")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("status", "APPROVED")
  ]);

  const [{ data: badges }, { data: recentAchievements }, { data: levelInfo }] = await Promise.all([
    supabase
      .from("badges")
      .select("id,group_id,badge_type,period_start,period_end,created_at,gym_groups(name)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("user_achievements")
      .select("id,earned_at,achievement_definitions(*)")
      .eq("user_id", profile.id)
      .order("earned_at", { ascending: false })
      .limit(3),
    supabase.rpc("get_user_level_info", { p_user_id: profile.id })
  ]);

  const level = (levelInfo as any)?.[0] ?? {
    total_xp: 0,
    current_level: 1,
    level_title: "Newcomer",
    level_color: "#6B7280",
    xp_for_current_level: 0,
    xp_for_next_level: 100,
    progress_percent: 0
  };

  return (
    <ProfileContent
      profile={{
        id: profile.id,
        name: profile.name,
        email: profile.email ?? "",
        avatar_url: profile.avatar_url,
        user_type: profile.user_type
      }}
      groupCount={groupCount ?? 0}
      totalApproved={totalApproved ?? 0}
      badges={(badges ?? []) as any}
      recentAchievements={(recentAchievements ?? []) as any}
      level={level}
    />
  );
}
