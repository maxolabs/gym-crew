import { notFound } from "next/navigation";
import { requireTrainer } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { TopBar } from "@/components/nav/TopBar";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatsCard } from "@/components/ui/StatsCard";
import { CountdownBadge } from "@/components/ui/CountdownBadge";
import { Avatar } from "@/components/ui/Avatar";
import { RoutineUploader } from "@/components/group/RoutineUploader";
import { InviteLinkCard } from "@/components/group/InviteLinkCard";
import { PendingApprovals } from "@/components/group/PendingApprovals";
import { Users, Calendar, CheckCircle } from "lucide-react";
import { monthRangeInTz, prevMonthStartInTz } from "@/lib/time";
import Link from "next/link";

export default async function TrainerGroupManagePage({
  params
}: {
  params: Promise<{ groupId: string }>;
}) {
  const profile = await requireTrainer();
  const { groupId } = await params;
  const supabase = await supabaseServer();

  const { data: group } = await supabase
    .from("gym_groups")
    .select("*")
    .eq("id", groupId)
    .eq("created_by", profile.id)
    .maybeSingle();

  if (!group) notFound();

  const tz = group.timezone ?? "UTC";
  const { start: monthStart, end: monthEnd } = monthRangeInTz(tz);

  const [
    { data: members },
    { data: locations },
    { data: monthCheckins },
    { data: pending }
  ] = await Promise.all([
    supabase
      .from("group_members")
      .select("user_id,role,joined_at,users(name,avatar_url)")
      .eq("group_id", groupId)
      .order("joined_at", { ascending: true }),
    supabase
      .from("gym_locations")
      .select("id,name")
      .eq("group_id", groupId),
    supabase
      .from("check_ins")
      .select("user_id")
      .eq("group_id", groupId)
      .eq("status", "APPROVED")
      .gte("checkin_date", monthStart)
      .lte("checkin_date", monthEnd),
    supabase
      .from("check_ins")
      .select("id,user_id,checkin_date,created_at,users(name)")
      .eq("group_id", groupId)
      .eq("method", "MANUAL")
      .eq("status", "PENDING")
      .order("created_at", { ascending: true })
  ]);

  const clientCount = Math.max(0, (members?.length ?? 0) - 1);
  const totalCheckins = monthCheckins?.length ?? 0;

  const memberCheckins = new Map<string, number>();
  for (const c of monthCheckins ?? []) {
    memberCheckins.set(c.user_id, (memberCheckins.get(c.user_id) ?? 0) + 1);
  }

  let routineSignedUrl: string | null = null;
  if (group.routine_url) {
    const { data } = await supabase.storage
      .from("routines")
      .createSignedUrl(group.routine_url, 60 * 60);
    routineSignedUrl = data?.signedUrl ?? null;
  }

  const hasExpiredRoutine =
    group.routine_deadline && new Date(group.routine_deadline) < new Date();

  return (
    <div className="space-y-4">
      <TopBar
        title={group.name}
        right={
          <Button href="/trainer/groups" variant="ghost">
            Back
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-2">
        <StatsCard
          icon={<Users className="h-4 w-4" />}
          value={clientCount}
          label="Clients"
        />
        <StatsCard
          icon={<CheckCircle className="h-4 w-4" />}
          value={totalCheckins}
          label="This Month"
        />
        <StatsCard
          icon={<Calendar className="h-4 w-4" />}
          value={locations?.length ?? 0}
          label="Locations"
        />
      </div>

      {(pending?.length ?? 0) > 0 && (
        <PendingApprovals items={(pending ?? []) as any} isAdmin={true} />
      )}

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Routine</CardTitle>
            {group.routine_name && (
              <CardMeta>{group.routine_name}</CardMeta>
            )}
          </div>
          {group.routine_deadline && !hasExpiredRoutine && (
            <CountdownBadge deadline={group.routine_deadline} />
          )}
          {hasExpiredRoutine && (
            <span className="rounded-full bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger">
              Expired
            </span>
          )}
        </div>

        {hasExpiredRoutine && (
          <div className="rounded-xl border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
            This routine has expired. Upload a new one for your clients to see.
          </div>
        )}

        <RoutineUploader
          groupId={groupId}
          currentUrl={routineSignedUrl}
          contentType={group.routine_content_type ?? null}
          currentName={group.routine_name ?? null}
          currentDeadline={group.routine_deadline ?? null}
        />
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle>Members</CardTitle>
          <span className="text-xs text-muted">{members?.length ?? 0} total</span>
        </div>

        <div className="space-y-2">
          {members?.map((m: any) => {
            const isTrainer = m.user_id === profile.id;
            const checkinCount = memberCheckins.get(m.user_id) ?? 0;

            return (
              <div
                key={m.user_id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-card2 p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={m.users?.avatar_url}
                    name={m.users?.name}
                    size="sm"
                    showTrainerBadge={isTrainer}
                  />
                  <div>
                    <p className="text-sm font-medium text-text">
                      {m.users?.name ?? "Unknown"}
                      {isTrainer && (
                        <span className="ml-1.5 text-xs text-muted">(You)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      Joined{" "}
                      {new Date(m.joined_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric"
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-text">{checkinCount}</p>
                  <p className="text-xs text-muted">this month</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <InviteLinkCard groupId={groupId} />

      <Card className="space-y-3">
        <CardTitle>Settings</CardTitle>
        <div className="space-y-2 text-sm text-muted">
          <p>
            <span className="text-text">Timezone:</span> {group.timezone}
          </p>
          {group.description && (
            <p>
              <span className="text-text">Description:</span> {group.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            href={`/g/${groupId}/locations`}
            variant="secondary"
            className="flex-1"
          >
            Manage Locations
          </Button>
          <Button href={`/g/${groupId}`} variant="secondary" className="flex-1">
            View Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
