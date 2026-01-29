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
    .select("routine_url,routine_content_type,routine_name,routine_deadline")
    .eq("id", groupId)
    .maybeSingle();

  let routineSignedUrl: string | null = null;
  if (group?.routine_url) {
    const { data } = await supabase.storage
      .from("routines")
      .createSignedUrl(group.routine_url, 60 * 60);
    routineSignedUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="space-y-3">
      <TopBar
        title="Manage Routine"
        right={
          <Button href={`/g/${groupId}`} variant="ghost">
            Back
          </Button>
        }
      />

      {!isAdmin ? (
        <Card className="space-y-2">
          <CardTitle>Admins only</CardTitle>
          <CardMeta>You don't have permission to upload/replace routines.</CardMeta>
        </Card>
      ) : (
        <Card className="space-y-4">
          <div>
            <CardTitle>
              {group?.routine_url ? "Update Routine" : "Upload Routine"}
            </CardTitle>
            <CardMeta>
              Set a name, deadline, and upload a PDF or image for your clients.
            </CardMeta>
          </div>
          <RoutineUploader
            groupId={groupId}
            currentUrl={routineSignedUrl}
            contentType={group?.routine_content_type ?? null}
            currentName={group?.routine_name ?? null}
            currentDeadline={group?.routine_deadline ?? null}
          />
        </Card>
      )}
    </div>
  );
}
