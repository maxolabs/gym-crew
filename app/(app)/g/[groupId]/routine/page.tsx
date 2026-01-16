import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { TopBar } from "@/components/nav/TopBar";
import { Button } from "@/components/ui/Button";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { RoutineUploader } from "@/components/group/RoutineUploader";

export default async function RoutinePage({
  params
}: {
  params: Promise<{ groupId: string }>;
}) {
  const user = await requireUser();
  const { groupId } = await params;
  const supabase = await supabaseServer();

  const { data: myMembership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  const isAdmin = myMembership?.role === "ADMIN";

  const { data: group } = await supabase
    .from("gym_groups")
    .select("routine_url")
    .eq("id", groupId)
    .maybeSingle();

  return (
    <div className="space-y-3">
      <TopBar
        title="Routine"
        right={
          <Button href={`/g/${groupId}`} variant="ghost">
            Back
          </Button>
        }
      />

      {!isAdmin ? (
        <Card className="space-y-2">
          <CardTitle>Admins only</CardTitle>
          <CardMeta>You don’t have permission to upload/replace routines.</CardMeta>
        </Card>
      ) : (
        <RoutineUploader groupId={groupId} existingPath={group?.routine_url ?? null} />
      )}
    </div>
  );
}


