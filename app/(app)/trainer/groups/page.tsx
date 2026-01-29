import { requireTrainer } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { TopBar } from "@/components/nav/TopBar";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CountdownBadge } from "@/components/ui/CountdownBadge";
import { Layers, Plus } from "lucide-react";
import Link from "next/link";

export default async function TrainerGroupsPage() {
  const profile = await requireTrainer();
  const supabase = await supabaseServer();

  const { data: groups } = await supabase
    .from("gym_groups")
    .select(
      `
      id,
      name,
      description,
      timezone,
      routine_url,
      routine_name,
      routine_deadline,
      created_at,
      group_members(count)
    `
    )
    .eq("created_by", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-3">
      <TopBar
        title="Your Groups"
        right={
          <Button href="/trainer/groups/new" className="h-10 gap-1.5 px-3">
            <Plus className="h-4 w-4" />
            New
          </Button>
        }
      />

      {!groups?.length ? (
        <EmptyState
          icon={<Layers className="h-7 w-7" />}
          title="No groups yet"
          description="Create your first group to start training clients."
          action={
            <Button href="/trainer/groups/new">Create Group</Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {groups.map((g) => {
            const memberCount =
              (g.group_members as unknown as { count: number }[])?.[0]?.count ?? 0;
            const clientCount = Math.max(0, memberCount - 1);
            const hasRoutine = !!g.routine_url;
            const hasExpiredRoutine =
              g.routine_deadline && new Date(g.routine_deadline) < new Date();

            return (
              <Card key={g.id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate">{g.name}</CardTitle>
                    <CardMeta className="truncate">
                      {g.description || "No description"}
                    </CardMeta>
                  </div>
                  <Button
                    href={`/trainer/groups/${g.id}`}
                    variant="secondary"
                    className="shrink-0"
                  >
                    Manage
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-card2 px-2.5 py-1 text-muted">
                    {clientCount} client{clientCount !== 1 ? "s" : ""}
                  </span>
                  <span className="rounded-full bg-card2 px-2.5 py-1 text-muted">
                    {g.timezone}
                  </span>
                  {hasRoutine && !hasExpiredRoutine && g.routine_deadline && (
                    <CountdownBadge deadline={g.routine_deadline} />
                  )}
                  {hasExpiredRoutine && (
                    <span className="rounded-full bg-danger/10 px-2.5 py-1 font-medium text-danger">
                      Routine Expired
                    </span>
                  )}
                  {!hasRoutine && (
                    <span className="rounded-full bg-warning/10 px-2.5 py-1 font-medium text-warning">
                      No Routine
                    </span>
                  )}
                </div>

                <Link
                  href={`/g/${g.id}`}
                  className="block text-xs text-muted hover:text-text"
                >
                  View client dashboard →
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
