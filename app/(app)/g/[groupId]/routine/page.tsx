import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { RoutineUploader } from "@/components/group/RoutineUploader";
import { RoutinePageContent } from "@/components/group/RoutinePageContent";

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
    <RoutinePageContent
      groupId={groupId}
      isAdmin={isAdmin}
      hasRoutine={!!group?.routine_url}
      routineSignedUrl={routineSignedUrl}
      routineContentType={group?.routine_content_type ?? null}
      routineName={group?.routine_name ?? null}
      routineDeadline={group?.routine_deadline ?? null}
    />
  );
}
