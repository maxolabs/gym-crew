import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { TopBar } from "@/components/nav/TopBar";
import { Button } from "@/components/ui/Button";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { LocationsManager } from "@/components/group/LocationsManager";

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
    <div className="space-y-3">
      <TopBar
        title="Locations"
        right={
          <Button href={`/g/${groupId}`} variant="ghost">
            Back
          </Button>
        }
      />

      {!isAdmin ? (
        <Card className="space-y-2">
          <CardTitle>Admins only</CardTitle>
          <CardMeta>You don’t have permission to manage locations.</CardMeta>
        </Card>
      ) : (
        <LocationsManager groupId={groupId} initial={(locations ?? []) as any} />
      )}
    </div>
  );
}


