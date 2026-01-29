import { requireTrainer } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { TopBar } from "@/components/nav/TopBar";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { StatsCard } from "@/components/ui/StatsCard";
import { Button } from "@/components/ui/Button";
import { Users, Layers, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function TrainerDashboardPage() {
  const profile = await requireTrainer();
  const supabase = await supabaseServer();

  const { data: groups } = await supabase
    .from("gym_groups")
    .select(
      `
      id,
      name,
      routine_deadline,
      routine_name,
      group_members(count)
    `
    )
    .eq("created_by", profile.id)
    .order("created_at", { ascending: false });

  const totalClients =
    groups?.reduce((sum, g) => {
      const count = (g.group_members as unknown as { count: number }[])?.[0]?.count ?? 0;
      return sum + Math.max(0, count - 1);
    }, 0) ?? 0;

  const { count: pendingCount } = await supabase
    .from("check_ins")
    .select("id", { count: "exact", head: true })
    .eq("method", "MANUAL")
    .eq("status", "PENDING")
    .in(
      "group_id",
      groups?.map((g) => g.id) ?? []
    );

  const expiredRoutines =
    groups?.filter(
      (g) => g.routine_deadline && new Date(g.routine_deadline) < new Date()
    ).length ?? 0;

  return (
    <div className="space-y-4">
      <TopBar title="Trainer Dashboard" />

      <div className="grid grid-cols-2 gap-3">
        <StatsCard
          icon={<Users className="h-5 w-5" />}
          value={totalClients}
          label="Total Clients"
        />
        <StatsCard
          icon={<Layers className="h-5 w-5" />}
          value={groups?.length ?? 0}
          label="Groups"
        />
        {(pendingCount ?? 0) > 0 && (
          <StatsCard
            icon={<Clock className="h-5 w-5" />}
            value={pendingCount ?? 0}
            label="Pending Approvals"
            className="border-warning/30 bg-warning/5"
          />
        )}
        {expiredRoutines > 0 && (
          <StatsCard
            icon={<AlertCircle className="h-5 w-5" />}
            value={expiredRoutines}
            label="Expired Routines"
            className="border-danger/30 bg-danger/5"
          />
        )}
      </div>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle>Your Groups</CardTitle>
          <Button href="/trainer/groups/new" variant="secondary" className="h-9 px-3 text-sm">
            New Group
          </Button>
        </div>

        {!groups?.length ? (
          <div className="py-4 text-center">
            <CardMeta>You haven't created any groups yet.</CardMeta>
            <Button href="/trainer/groups/new" className="mt-3">
              Create your first group
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {groups.slice(0, 5).map((g) => {
              const memberCount =
                (g.group_members as unknown as { count: number }[])?.[0]?.count ?? 0;
              const clientCount = Math.max(0, memberCount - 1);
              const hasExpiredRoutine =
                g.routine_deadline && new Date(g.routine_deadline) < new Date();

              return (
                <Link
                  key={g.id}
                  href={`/trainer/groups/${g.id}`}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-card2 p-3 transition-colors hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text">{g.name}</p>
                    <p className="text-xs text-muted">
                      {clientCount} client{clientCount !== 1 ? "s" : ""}
                      {g.routine_name && ` • ${g.routine_name}`}
                    </p>
                  </div>
                  {hasExpiredRoutine && (
                    <span className="ml-2 shrink-0 rounded-full bg-danger/10 px-2 py-1 text-xs font-medium text-danger">
                      Expired
                    </span>
                  )}
                </Link>
              );
            })}
            {groups.length > 5 && (
              <Button href="/trainer/groups" variant="ghost" className="w-full">
                View all {groups.length} groups
              </Button>
            )}
          </div>
        )}
      </Card>

      <Card className="space-y-2">
        <CardTitle>Quick Actions</CardTitle>
        <div className="grid grid-cols-2 gap-2">
          <Button href="/trainer/groups/new" variant="secondary" className="h-12">
            Create Group
          </Button>
          <Button href="/trainer/groups" variant="secondary" className="h-12">
            Manage Groups
          </Button>
        </div>
      </Card>
    </div>
  );
}
