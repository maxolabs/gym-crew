import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { LocationsManager } from "@/components/group/LocationsManager";
import { LocationsPageContent } from "@/components/group/LocationsPageContent";

export default async function LocationsPage({
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

  const { data: locations } = await supabase
    .from("gym_locations")
    .select("id,name,lat,lng,radius_m")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });

  return (
    <LocationsPageContent
      groupId={groupId}
      isAdmin={isAdmin}
      locations={(locations ?? []) as any}
    />
  );
}
