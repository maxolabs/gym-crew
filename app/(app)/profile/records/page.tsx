import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { TopBar } from "@/components/nav/TopBar";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Trophy } from "lucide-react";

type PRRow = {
  id: string;
  weight_kg: number;
  reps: number;
  notes: string | null;
  recorded_at: string;
  exercises: { name: string; muscle_group: string } | null;
};

const MUSCLE_GROUP_ORDER = [
  "Chest",
  "Back",
  "Shoulders",
  "Legs",
  "Arms",
  "Core",
  "Warmup",
];

export default async function PersonalRecordsPage() {
  const user = await requireUser();
  const supabase = await supabaseServer();

  const { data } = await supabase
    .from("personal_records")
    .select("id,weight_kg,reps,notes,recorded_at,exercises(name,muscle_group)")
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: false });

  const records = (data ?? []) as unknown as PRRow[];

  // Group by muscle group
  const grouped = new Map<string, PRRow[]>();
  for (const r of records) {
    const group = r.exercises?.muscle_group ?? "Other";
    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group)!.push(r);
  }

  // Sort groups by predefined order
  const sortedGroups = [...grouped.entries()].sort((a, b) => {
    const ai = MUSCLE_GROUP_ORDER.indexOf(a[0]);
    const bi = MUSCLE_GROUP_ORDER.indexOf(b[0]);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="space-y-3">
      <TopBar
        title="Personal Records"
        right={
          <Button href="/profile" variant="ghost">
            Back
          </Button>
        }
      />

      {records.length === 0 ? (
        <EmptyState
          icon={<Trophy className="h-8 w-8" />}
          title="No PRs recorded yet"
          description="Tap an exercise in your routine to set your personal records."
        />
      ) : (
        <>
          <Card className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-warning" />
              <CardTitle>
                {records.length} PR{records.length !== 1 ? "s" : ""}
              </CardTitle>
            </div>
            <p className="text-xs text-muted">
              Your best lifts across all exercises
            </p>
          </Card>

          {sortedGroups.map(([group, prs]) => (
            <Card key={group} className="space-y-2">
              <CardTitle className="text-sm">{group}</CardTitle>
              <div className="space-y-1.5">
                {prs
                  .sort((a, b) =>
                    (a.exercises?.name ?? "").localeCompare(
                      b.exercises?.name ?? ""
                    )
                  )
                  .map((pr) => (
                    <div
                      key={pr.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-card2 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text">
                          {pr.exercises?.name ?? "Unknown"}
                        </p>
                        <p className="text-[10px] text-muted">
                          {new Date(pr.recorded_at).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-warning">
                          {pr.weight_kg} kg
                        </p>
                        <p className="text-[10px] text-muted">
                          x {pr.reps} {pr.reps === 1 ? "rep" : "reps"}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
