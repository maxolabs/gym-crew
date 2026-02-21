import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { TopBar } from "@/components/nav/TopBar";
import { Button } from "@/components/ui/Button";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Calendar, CheckCircle, Clock } from "lucide-react";

export default async function WorkoutHistoryPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const user = await requireUser();
  const { groupId } = await params;
  const supabase = await supabaseServer();

  // Fetch sessions for this user in this group's routines
  const { data: sessions } = await supabase
    .from("routine_sessions")
    .select(
      "id,session_date,week_number,completed_at,routine_id,day_id,routine_days(label,day_number),routines(name)"
    )
    .eq("user_id", user.id)
    .order("session_date", { ascending: false })
    .limit(50);

  // Filter to only sessions belonging to this group
  // We need to check via the routine's group_id
  const { data: groupRoutines } = await supabase
    .from("routines")
    .select("id")
    .eq("group_id", groupId);

  const groupRoutineIds = new Set((groupRoutines ?? []).map((r) => r.id));
  const filteredSessions = (sessions ?? []).filter((s) =>
    groupRoutineIds.has(s.routine_id)
  );

  // For each session, get log count
  const sessionIds = filteredSessions.map((s) => s.id);
  let logCounts = new Map<string, number>();
  if (sessionIds.length > 0) {
    const { data: logData } = await supabase
      .from("exercise_logs")
      .select("session_id")
      .in("session_id", sessionIds);
    for (const l of logData ?? []) {
      logCounts.set(l.session_id, (logCounts.get(l.session_id) ?? 0) + 1);
    }
  }

  return (
    <div className="space-y-3">
      <TopBar
        title="Workout History"
        right={
          <Button href={`/g/${groupId}`} variant="ghost">
            Back
          </Button>
        }
      />

      {filteredSessions.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-8 w-8" />}
          title="No workouts yet"
          description="Start a workout from your routine to see history here."
        />
      ) : (
        <div className="space-y-2">
          {filteredSessions.map((session: any) => {
            const dayInfo = session.routine_days;
            const routineInfo = session.routines;
            const logCount = logCounts.get(session.id) ?? 0;
            const isComplete = !!session.completed_at;

            return (
              <Card key={session.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isComplete ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <Clock className="h-4 w-4 text-warning" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-text">
                        Day {dayInfo?.day_number ?? "?"}{" "}
                        {dayInfo?.label && `- ${dayInfo.label}`}
                      </p>
                      <p className="text-xs text-muted">
                        {routineInfo?.name ?? "Routine"} · Week{" "}
                        {session.week_number}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-text">
                      {new Date(session.session_date).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric" }
                      )}
                    </p>
                    {logCount > 0 && (
                      <p className="text-[10px] text-muted">
                        {logCount} sets logged
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
