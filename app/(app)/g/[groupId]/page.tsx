import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { GroupDashboard } from "@/components/group/GroupDashboard";
import { computeStreak, monthRangeInTz, prevMonthStartInTz, todayInTz } from "@/lib/time";

export default async function GroupDashboardPage({
  params
}: {
  params: Promise<{ groupId: string }>;
}) {
  const user = await requireUser();
  const { groupId } = await params;
  const supabase = await supabaseServer();

  // First, fetch group and membership (required for notFound checks)
  const [{ data: group }, { data: myMembership }] = await Promise.all([
    supabase
      .from("gym_groups")
      .select("id,name,description,timezone,routine_url,routine_content_type,routine_name,routine_deadline,created_by,created_at")
      .eq("id", groupId)
      .maybeSingle(),
    supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .maybeSingle()
  ]);

  if (!group) notFound();
  if (!myMembership) notFound();

  const isAdmin = myMembership.role === "ADMIN";
  const tz = group.timezone ?? "UTC";
  const { start: monthStart, end: monthEnd } = monthRangeInTz(tz);
  const today = todayInTz(tz);
  const prevMonthStart = prevMonthStartInTz(tz);

  // Parallelize all independent queries
  const [
    { data: members },
    { data: locations },
    { data: monthCheckins },
    { data: recentMine },
    { data: pending },
    { data: lastMonthWinner },
    { data: todayCheckins }
  ] = await Promise.all([
    supabase
      .from("group_members")
      .select("user_id,role,users(name,avatar_url)")
      .eq("group_id", groupId)
      .order("role", { ascending: true }),
    supabase
      .from("gym_locations")
      .select("id,name,lat,lng,radius_m")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true }),
    supabase
      .from("check_ins")
      .select("user_id,checkin_date,created_at")
      .eq("group_id", groupId)
      .eq("status", "APPROVED")
      .gte("checkin_date", monthStart)
      .lte("checkin_date", monthEnd),
    supabase
      .from("check_ins")
      .select("checkin_date")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .eq("status", "APPROVED")
      .order("checkin_date", { ascending: false })
      .limit(90),
    supabase
      .from("check_ins")
      .select("id,user_id,checkin_date,created_at,users(name)")
      .eq("group_id", groupId)
      .eq("method", "MANUAL")
      .eq("status", "PENDING")
      .order("created_at", { ascending: true }),
    supabase
      .from("badges")
      .select("user_id,users(name)")
      .eq("group_id", groupId)
      .eq("badge_type", "MONTH_WINNER")
      .eq("period_start", prevMonthStart)
      .maybeSingle(),
    supabase
      .from("check_ins")
      .select("id,user_id,method,created_at,users(name)")
      .eq("group_id", groupId)
      .eq("status", "APPROVED")
      .eq("checkin_date", today)
      .order("created_at", { ascending: false })
  ]);

  // Try to award last month's winner (idempotent, non-critical if it fails)
  try {
    await supabase.rpc("award_month_winner", {
      p_group_id: groupId,
      p_period_start: prevMonthStart
    });
  } catch {
    // non-critical
  }

  // Compute leaderboard (exclude trainer)
  const trainerId = group.created_by;
  const counts = new Map<string, number>();
  for (const c of monthCheckins ?? []) {
    counts.set(c.user_id, (counts.get(c.user_id) ?? 0) + 1);
  }
  const leaderboard = (members ?? [])
    .filter((m: any) => m.user_id !== trainerId) // Exclude trainer
    .map((m: any) => ({
      user_id: m.user_id,
      name: m.users?.name ?? m.user_id,
      count: counts.get(m.user_id) ?? 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const myMonthCount = counts.get(user.id) ?? 0;

  const streak = computeStreak(
    (recentMine ?? []).map((x) => x.checkin_date),
    today
  );

  // Generate signed URL for routine (if exists)
  let routineSignedUrl: string | null = null;
  if (group.routine_url) {
    try {
      const { data } = await supabase.storage
        .from("routines")
        .createSignedUrl(group.routine_url, 60 * 60);
      routineSignedUrl = data?.signedUrl ?? null;
    } catch {
      routineSignedUrl = null;
    }
  }

  const lastMonthWinnerName = lastMonthWinner
    ? (lastMonthWinner.users as unknown as { name: string } | null)?.name ?? null
    : null;

  // Fetch user's XP level info
  const { data: levelInfo } = await supabase.rpc("get_user_level_info", {
    p_user_id: user.id,
  });
  const xpInfo = (levelInfo as any)?.[0] ?? null;

  // Count hypes received today by this user (across this group's check-ins)
  const myTodayCheckIn = (todayCheckins ?? []).find((c) => c.user_id === user.id);
  let todayHypesReceived = 0;
  if (myTodayCheckIn) {
    const { count } = await supabase
      .from("hypes")
      .select("id", { count: "exact", head: true })
      .eq("check_in_id", myTodayCheckIn.id);
    todayHypesReceived = count ?? 0;
  }

  // Build today's activity with hype data
  const checkInIds = (todayCheckins ?? []).map((c) => c.id);
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
        .eq("from_user_id", user.id),
    ]);

    for (const h of hypeRows ?? []) {
      hypeCounts.set(h.check_in_id, (hypeCounts.get(h.check_in_id) ?? 0) + 1);
    }
    for (const h of myHypes ?? []) {
      userHyped.add(h.check_in_id);
    }
  }

  const todayActivity = (todayCheckins ?? []).map((c: any) => ({
    id: c.id,
    user_id: c.user_id,
    user_name: c.users?.name ?? "Unknown",
    method: c.method,
    created_at: c.created_at,
    hype_count: hypeCounts.get(c.id) ?? 0,
    user_hyped: userHyped.has(c.id),
  }));

  return (
    <GroupDashboard
      groupId={groupId}
      groupName={group.name}
      description={group.description}
      timezone={tz}
      routineUrl={routineSignedUrl}
      contentType={group.routine_content_type ?? null}
      routineName={group.routine_name ?? null}
      routineDeadline={group.routine_deadline ?? null}
      isAdmin={isAdmin}
      userId={user.id}
      members={(members ?? []) as any}
      locations={(locations ?? []) as any}
      myMonthCount={myMonthCount}
      streak={streak}
      lastMonthWinnerName={lastMonthWinnerName}
      leaderboard={leaderboard}
      pending={(pending ?? []) as any}
      todayActivity={todayActivity}
      todayHypesReceived={todayHypesReceived}
      xpInfo={xpInfo}
    />
  );
}
