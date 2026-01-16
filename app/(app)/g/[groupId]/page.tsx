import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { TopBar } from "@/components/nav/TopBar";
import { Button } from "@/components/ui/Button";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { SetCurrentGroup } from "@/components/group/SetCurrentGroup";
import { RoutineCard } from "@/components/group/RoutineCard";
import { InviteLinkCard } from "@/components/group/InviteLinkCard";
import { CheckInCard } from "@/components/group/CheckInCard";
import { PendingApprovals } from "@/components/group/PendingApprovals";
import { LeaveGroupButton } from "@/components/group/LeaveGroupButton";
import { monthRangeInTz, prevMonthStartInTz, todayInTz } from "@/lib/time";

function computeStreak(dates: string[], today: string) {
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
      .select("id,name,description,timezone,routine_url,routine_content_type,created_at")
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
    { data: lastMonthWinner }
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
      .maybeSingle()
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

  // Compute leaderboard
  const counts = new Map<string, number>();
  for (const c of monthCheckins ?? []) {
    counts.set(c.user_id, (counts.get(c.user_id) ?? 0) + 1);
  }
  const leaderboard = (members ?? [])
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

  return (
    <div className="space-y-3">
      <SetCurrentGroup groupId={groupId} />

      <TopBar
        title={group.name}
        right={
          <Button href="/groups" variant="ghost">
            Groups
          </Button>
        }
      />

      {group.description ? (
        <Card className="space-y-1">
          <CardTitle>Overview</CardTitle>
          <CardMeta>{group.description}</CardMeta>
          <p className="text-xs text-muted">Timezone: {tz}</p>
        </Card>
      ) : null}

      <Card className="space-y-2">
        <CardTitle>This month</CardTitle>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-card2 px-3 py-3">
            <p className="text-xs text-muted">Your approved</p>
            <p className="text-2xl font-bold">{myMonthCount}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-card2 px-3 py-3">
            <p className="text-xs text-muted">Streak (needs today)</p>
            <p className="text-2xl font-bold">{streak}</p>
          </div>
        </div>
        {lastMonthWinner ? (
          <p className="text-xs text-muted">
            Last month winner:{" "}
            <span className="font-semibold text-text">
              {(lastMonthWinner.users as unknown as { name: string } | null)?.name ?? lastMonthWinner.user_id}
            </span>
          </p>
        ) : (
          <p className="text-xs text-muted">Last month winner: —</p>
        )}
      </Card>

      <RoutineCard
        groupId={groupId}
        routineUrl={routineSignedUrl}
        contentType={group.routine_content_type ?? null}
        isAdmin={isAdmin}
      />

      {isAdmin ? <InviteLinkCard groupId={groupId} /> : null}

      <Card className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>Locations</CardTitle>
            <CardMeta>
              {locations?.length
                ? `${locations.length} location(s) set`
                : "No locations yet"}
            </CardMeta>
          </div>
          {isAdmin ? (
            <Button href={`/g/${groupId}/locations`} variant="secondary">
              Manage
            </Button>
          ) : null}
        </div>
        {locations?.length ? (
          <div className="space-y-2">
            {locations.slice(0, 3).map((l: any) => (
              <div
                key={l.id}
                className="rounded-xl border border-white/10 bg-card2 px-3 py-2"
              >
                <p className="text-sm font-semibold">{l.name}</p>
                <p className="text-xs text-muted">
                  Radius: {l.radius_m}m • {l.lat.toFixed(5)}, {l.lng.toFixed(5)}
                </p>
              </div>
            ))}
            {locations.length > 3 ? (
              <p className="text-xs text-muted">…and {locations.length - 3} more</p>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-muted">
            Check-ins need a location radius. Ask an admin to add one.
          </p>
        )}
      </Card>

      <CheckInCard
        groupId={groupId}
        timezone={tz}
        userId={user.id}
        locations={(locations ?? []) as any}
      />

      <PendingApprovals items={(pending ?? []) as any} isAdmin={isAdmin} />

      <Card className="space-y-2">
        <CardTitle>Leaderboard (this month)</CardTitle>
        {!leaderboard.length ? (
          <CardMeta>No approved check-ins yet.</CardMeta>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((row, idx) => (
              <div
                key={row.user_id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-card2 px-3 py-2"
              >
                <p className="truncate text-sm">
                  <span className="text-muted">{idx + 1}.</span>{" "}
                  <span className="font-semibold">{row.name}</span>
                </p>
                <p className="text-sm font-semibold">{row.count}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle>Members</CardTitle>
          <LeaveGroupButton
            groupId={groupId}
            userId={user.id}
            isAdmin={isAdmin}
            memberCount={members?.length ?? 0}
          />
        </div>
        <div className="space-y-2">
          {(members ?? []).map((m: any) => (
            <div
              key={m.user_id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-card2 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {m.users?.name ?? m.user_id}
                </p>
                <p className="text-xs text-muted">{m.role}</p>
              </div>
              {m.user_id === user.id ? (
                <span className="text-xs text-muted">You</span>
              ) : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}


