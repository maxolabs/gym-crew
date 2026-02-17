import { requireUserProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { TopBar } from "@/components/nav/TopBar";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { StatsCard } from "@/components/ui/StatsCard";
import { Button } from "@/components/ui/Button";
import { CountdownBadge } from "@/components/ui/CountdownBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActivityFeed, type ActivityItem } from "@/components/group/ActivityFeed";
import { Calendar, Flame, Award, Layers } from "lucide-react";
import { monthRangeInTz, todayInTz } from "@/lib/time";
import Link from "next/link";
import type { Database } from "@/lib/supabase/types";

type GroupWithStats = Database["public"]["Functions"]["get_my_groups_with_stats"]["Returns"][number];

function computeStreak(dates: string[], today: string): number {
  const set = new Set(dates);
  if (!set.has(today)) return 0;
  let streak = 0;
  let cur = new Date(`${today}T00:00:00Z`);
  while (true) {
    const key = cur.toISOString().slice(0, 10);
    if (!set.has(key)) break;
    streak += 1;
    cur = new Date(cur.getTime() - 24 * 60 * 60 * 1000);
  }
  return streak;
}

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
    <div className="space-y-4">
      <TopBar title={`Hey, ${profile.name.split(" ")[0]}`} />

      <div className="grid grid-cols-3 gap-2">
        <StatsCard
          icon={<Calendar className="h-4 w-4" />}
          value={totalMonthCheckins}
          label="This Month"
        />
        <StatsCard
          icon={<Flame className="h-4 w-4" />}
          value={globalStreak}
          label="Day Streak"
        />
        <StatsCard
          icon={<Award className="h-4 w-4" />}
          value={badges?.length ?? 0}
          label="Badges"
        />
      </div>

      {!groupsWithStats?.length ? (
        <EmptyState
          icon={<Layers className="h-7 w-7" />}
          title="No groups yet"
          description="Join a trainer's group to get started with your fitness journey."
          action={
            <Button href="/groups">Find Groups</Button>
          }
        />
      ) : (
        <>
          <Card className="space-y-3">
            <CardTitle>Today's Check-ins</CardTitle>
            <div className="space-y-2">
              {groupsWithStats.map((g: GroupWithStats) => {
                const checkedIn = todayCheckedGroups.has(g.id);
                const hasActiveRoutine =
                  g.routine_deadline && new Date(g.routine_deadline) > new Date();

                return (
                  <Link
                    key={g.id}
                    href={`/g/${g.id}`}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-card2 p-3 transition-colors hover:bg-white/5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-text">{g.name}</p>
                      <p className="text-xs text-muted">
                        by {g.trainer_name}
                        {g.routine_name && ` • ${g.routine_name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasActiveRoutine && g.routine_deadline && (
                        <CountdownBadge deadline={g.routine_deadline} />
                      )}
                      {checkedIn ? (
                        <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                          Done
                        </span>
                      ) : (
                        <Button variant="primary" className="h-8 px-3 text-xs">
                          Check In
                        </Button>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>

          {activityItems.length > 0 && (
            <ActivityFeed
              items={activityItems}
              currentUserId={profile.id}
              showGroupName
            />
          )}

          {(badges?.length ?? 0) > 0 && (
            <Card className="space-y-3">
              <CardTitle>Recent Badges</CardTitle>
              <div className="space-y-2">
                {badges?.map((b: any) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-card2 p-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10 text-warning">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">
                        {b.badge_type === "MONTH_WINNER" ? "Month Winner" : b.badge_type}
                      </p>
                      <p className="text-xs text-muted">
                        {b.gym_groups?.name} •{" "}
                        {new Date(b.period_start).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric"
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
