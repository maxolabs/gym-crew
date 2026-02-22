import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { TopBar } from "@/components/nav/TopBar";
import { Button } from "@/components/ui/Button";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { RoutineBuilderForm } from "@/components/routine/builder/RoutineBuilderForm";
import type { ActiveRoutine } from "@/lib/routine";

export default async function RoutineBuilderPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const user = await requireUser();
  const { groupId } = await params;
  const supabase = await supabaseServer();

  // Check admin
  const { data: myMembership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  const isAdmin = myMembership?.role === "ADMIN";

  if (!isAdmin) {
    return (
      <div className="space-y-3">
        <TopBar
          title="Routine Builder"
          right={
            <Button href={`/g/${groupId}`} variant="ghost">
              Back
            </Button>
          }
        />
        <Card className="space-y-2">
          <CardTitle>Admins only</CardTitle>
          <CardMeta>You don&apos;t have permission to build routines.</CardMeta>
        </Card>
      </div>
    );
  }

  // Fetch existing active routine for editing
  const { data: existingRoutine } = await supabase.rpc("get_active_routine", {
    p_group_id: groupId,
  });

  return (
    <div className="space-y-3">
      <TopBar
        title={existingRoutine ? "Edit Routine" : "Build Routine"}
        right={
          <Button href={`/g/${groupId}`} variant="ghost">
            Back
          </Button>
        }
      />
      <RoutineBuilderForm
        groupId={groupId}
        existingRoutine={(existingRoutine as ActiveRoutine) ?? null}
      />
    </div>
  );
}
