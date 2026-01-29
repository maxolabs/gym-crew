import { requireUserProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { TopBar } from "@/components/nav/TopBar";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CountdownBadge } from "@/components/ui/CountdownBadge";
import { Layers } from "lucide-react";
import { monthRangeInTz } from "@/lib/time";
import type { Database } from "@/lib/supabase/types";

type GroupWithStats = Database["public"]["Functions"]["get_my_groups_with_stats"]["Returns"][number];

export default async function GroupsPage() {
  const profile = await requireUserProfile();
  const supabase = await supabaseServer();

  const { start, end } = monthRangeInTz("UTC");

  const { data: withStats } = await supabase.rpc("get_my_groups_with_stats", {
    p_month_start: start,
    p_month_end: end
  });

  const isTrainer = profile.user_type === "TRAINER";

  return (
    <div className="space-y-3">
      <TopBar
        title="My Groups"
        right={
          isTrainer ? (
            <Button href="/trainer/groups/new">Create</Button>
          ) : null
        }
      />

      {!withStats?.length ? (
        <EmptyState
          icon={<Layers className="h-7 w-7" />}
          title="No groups yet"
          description={
            isTrainer
              ? "Create a group to start training clients."
              : "Ask your trainer for an invite link to join their group."
          }
          action={
            isTrainer ? (
              <Button href="/trainer/groups/new">Create Group</Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-3">
          {withStats.map((g: GroupWithStats) => {
            const hasActiveRoutine =
              g.routine_deadline && new Date(g.routine_deadline) > new Date();
            const hasExpiredRoutine =
              g.routine_deadline && new Date(g.routine_deadline) <= new Date();

            return (
              <Card key={g.id} className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate">{g.name}</CardTitle>
                    <CardMeta className="truncate">
                      {g.description || `Trainer: ${g.trainer_name}`}
                    </CardMeta>
                  </div>
                  <Button href={`/g/${g.id}`} variant="secondary">
                    Open
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-card2 px-2.5 py-1 text-xs text-muted">
                    {g.my_month_count} check-ins this month
                  </span>
                  {g.routine_name && hasActiveRoutine && g.routine_deadline && (
                    <CountdownBadge deadline={g.routine_deadline} />
                  )}
                  {hasExpiredRoutine && (
                    <span className="rounded-full bg-muted/10 px-2.5 py-1 text-xs text-muted">
                      Routine ended
                    </span>
                  )}
                </div>

                {!isTrainer && (
                  <p className="text-xs text-muted">
                    Trainer: {g.trainer_name}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {!isTrainer && withStats && withStats.length > 0 && (
        <Card className="text-center">
          <CardMeta className="mb-2">
            Have an invite link? Use it to join another group.
          </CardMeta>
        </Card>
      )}
    </div>
  );
}
