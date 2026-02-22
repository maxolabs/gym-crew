import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { TopBar } from "@/components/nav/TopBar";
import { Button } from "@/components/ui/Button";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { WorkoutSession } from "@/components/routine/WorkoutSession";
import type { ActiveRoutine } from "@/lib/routine";

export default async function WorkoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ day?: string; week?: string }>;
}) {
  const user = await requireUser();
  const { groupId } = await params;
  const { day: dayId, week } = await searchParams;
  const supabase = await supabaseServer();

  const { data: routine } = await supabase.rpc("get_active_routine", {
    p_group_id: groupId,
  });

  if (!routine || !dayId) {
    return (
      <div className="space-y-3">
        <TopBar
          title="Workout"
          right={
            <Button href={`/g/${groupId}`} variant="ghost">
              Back
            </Button>
          }
        />
        <Card>
          <CardTitle>No Active Routine</CardTitle>
          <CardMeta>Ask your trainer to create a routine for this group.</CardMeta>
        </Card>
      </div>
    );
  }

  const activeRoutine = routine as ActiveRoutine;
  const currentWeek = parseInt(week ?? "1", 10);
  const day = activeRoutine.days.find((d) => d.id === dayId);

  if (!day) {
    return (
      <div className="space-y-3">
        <TopBar
          title="Workout"
          right={
            <Button href={`/g/${groupId}`} variant="ghost">
              Back
            </Button>
          }
        />
        <Card>
          <CardTitle>Day Not Found</CardTitle>
          <CardMeta>This workout day doesn&apos;t exist.</CardMeta>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <TopBar
        title={day.label || `Day ${day.day_number}`}
        right={
          <Button href={`/g/${groupId}`} variant="ghost">
            Back
          </Button>
        }
      />
      <WorkoutSession
        groupId={groupId}
        routine={activeRoutine}
        day={day}
        currentWeek={currentWeek}
        userId={user.id}
      />
    </div>
  );
}
