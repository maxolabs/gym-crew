import { requireUserProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import type { ActivityItem } from "@/components/group/ActivityFeed";
import { computeStreak, monthRangeInTz, todayInTz } from "@/lib/time";
import type { Database } from "@/lib/supabase/types";

type GroupWithStats = Database["public"]["Functions"]["get_my_groups_with_stats"]["Returns"][number];

export default async function UserDashboardPage() {
  const profile = await requireUserProfile();
  const supabase = await supabaseServer();

  const { start, end } = monthRangeInTz("UTC");

  const { data: groupsWithStats } = await supabase.rpc("get_my_groups_with_stats", {
    p_month_start: start,
    p_month_end: end
  });

  const { data: recentCheckins } = await supabase
    .from("check_ins")
    .select("checkin_date,group_id")
    .eq("user_id", profile.id)
    .eq("status", "APPROVED")
    .order("checkin_date", { ascending: false })
    .limit(90);

  const { data: badges } = await supabase
    .from("badges")
    .select("id,badge_type,period_start,period_end,group_id,gym_groups(name)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch today's approved check-ins across all user's groups (for activity feed)
  const myGroupIds = groupsWithStats?.map((g: GroupWithStats) => g.id) ?? [];
  let activityItems: ActivityItem[] = [];

  if (myGroupIds.length > 0) {
    const today = todayInTz("UTC");

    const { data: todayAllCheckins } = await supabase
      .from("check_ins")
      .select("id,user_id,method,created_at,group_id,users(name),gym_groups(name)")
      .in("group_id", myGroupIds)
      .eq("status", "APPROVED")
      .eq("checkin_date", today)
      .order("created_at", { ascending: false })
      .limit(20);

    const checkInIds = (todayAllCheckins ?? []).map((c) => c.id);
    let hypeCounts = new Map<string, number>();
    let userHyped = new Set<string>();

    if (checkInIds.length > 0) {
      const [{ data: hypeRows }, { data: myHypes }] = await Promise.all([
        supabase
          .from("hypes")
          .select("check_in_id")
          .in("check_in_id", checkInIds),
        supabase
          .from("hypes")
          .select("check_in_id")
          .in("check_in_id", checkInIds)
          .eq("from_user_id", profile.id),
      ]);

      for (const h of hypeRows ?? []) {
        hypeCounts.set(h.check_in_id, (hypeCounts.get(h.check_in_id) ?? 0) + 1);
      }
      for (const h of myHypes ?? []) {
        userHyped.add(h.check_in_id);
      }
    }

    activityItems = (todayAllCheckins ?? []).map((c: any) => ({
      id: c.id,
      user_id: c.user_id,
      user_name: c.users?.name ?? "Unknown",
      method: c.method,
      created_at: c.created_at,
      hype_count: hypeCounts.get(c.id) ?? 0,
      user_hyped: userHyped.has(c.id),
      group_name: c.gym_groups?.name ?? undefined,
    }));
  }

  const today = todayInTz("UTC");
  const allDates = recentCheckins?.map((c) => c.checkin_date) ?? [];
  const globalStreak = computeStreak(allDates, today);

  const totalMonthCheckins =
    groupsWithStats?.reduce((sum: number, g: GroupWithStats) => sum + (g.my_month_count ?? 0), 0) ?? 0;

  const todayCheckedGroups = new Set(
    recentCheckins?.filter((c) => c.checkin_date === today).map((c) => c.group_id) ?? []
  );

  return (
    <DashboardContent
      profileName={profile.name}
      profileId={profile.id}
      groupsWithStats={groupsWithStats as any}
      totalMonthCheckins={totalMonthCheckins}
      globalStreak={globalStreak}
      badges={(badges ?? []) as any}
      todayCheckedGroups={todayCheckedGroups}
      activityItems={activityItems}
    />
  );
}
