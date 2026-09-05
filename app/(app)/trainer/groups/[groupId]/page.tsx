import { notFound } from "next/navigation";
import { requireTrainer } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { TrainerGroupDetailContent } from "@/components/trainer/TrainerGroupDetailContent";
import { monthRangeInTz } from "@/lib/time";

export default async function TrainerGroupManagePage({
  params
}: {
  params: Promise<{ groupId: string }>;
}) {
  const profile = await requireTrainer();
  const { groupId } = await params;
  const supabase = await supabaseServer();

  const { data: group } = await supabase
    .from("gym_groups")
    .select("*")
    .eq("id", groupId)
    .eq("created_by", profile.id)
    .maybeSingle();

  if (!group) notFound();

  const tz = group.timezone ?? "UTC";
  const { start: monthStart, end: monthEnd } = monthRangeInTz(tz);

  const [
    { data: members },
    { data: locations },
    { data: monthCheckins },
    { data: pending }
  ] = await Promise.all([
    supabase
      .from("group_members")
      .select("user_id,role,joined_at,users(name,avatar_url)")
      .eq("group_id", groupId)
      .order("joined_at", { ascending: true }),
    supabase
      .from("gym_locations")
      .select("id,name")
      .eq("group_id", groupId),
    supabase
      .from("check_ins")
      .select("user_id")
      .eq("group_id", groupId)
      .eq("status", "APPROVED")
      .gte("checkin_date", monthStart)
      .lte("checkin_date", monthEnd),
    supabase
      .from("check_ins")
      .select("id,user_id,checkin_date,created_at,users(name)")
      .eq("group_id", groupId)
      .eq("method", "MANUAL")
      .eq("status", "PENDING")
      .order("created_at", { ascending: true })
  ]);

  const totalCheckins = monthCheckins?.length ?? 0;

  const memberCheckins = new Map<string, number>();
  for (const c of monthCheckins ?? []) {
    memberCheckins.set(c.user_id, (memberCheckins.get(c.user_id) ?? 0) + 1);
  }

  let routineSignedUrl: string | null = null;
  if (group.routine_url) {
    const { data } = await supabase.storage
      .from("routines")
      .createSignedUrl(group.routine_url, 60 * 60);
    routineSignedUrl = data?.signedUrl ?? null;
  }

  const hasExpiredRoutine =
    !!group.routine_deadline && new Date(group.routine_deadline) < new Date();

  return (
    <TrainerGroupDetailContent
      groupId={groupId}
      groupName={group.name}
      groupDescription={group.description}
      timezone={tz}
      routineSignedUrl={routineSignedUrl}
      routineContentType={group.routine_content_type ?? null}
      routineName={group.routine_name ?? null}
      routineDeadline={group.routine_deadline ?? null}
      hasExpiredRoutine={hasExpiredRoutine}
      profileId={profile.id}
      members={(members ?? []) as any}
      locations={(locations ?? []) as any}
      totalCheckins={totalCheckins}
      pending={(pending ?? []) as any}
      memberCheckins={memberCheckins}
    />
  );
}
