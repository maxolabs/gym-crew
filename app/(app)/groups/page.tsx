import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { TopBar } from "@/components/nav/TopBar";
import { Button } from "@/components/ui/Button";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { monthRangeInTz } from "@/lib/time";

export default async function GroupsPage() {
  await requireUser();
  const supabase = await supabaseServer();

  // Use UTC for the overall month range - each group's timezone is handled in the RPC
  const { start, end } = monthRangeInTz("UTC");

  const { data: withStats } = await supabase.rpc("get_my_groups_with_stats", {
    p_month_start: start,
    p_month_end: end
  });

  return (
    <div className="space-y-3">
      <TopBar title="My Groups" right={<Button href="/groups/new">Create</Button>} />

      {!withStats?.length ? (
        <Card className="space-y-3">
          <CardTitle>No groups yet</CardTitle>
          <CardMeta>Create one, then share the join link with your friends.</CardMeta>
          <Button href="/groups/new" size="lg">
            Create your first group
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {withStats.map((g: any) => (
            <Card key={g.id} className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="truncate">{g.name}</CardTitle>
                  <CardMeta className="truncate">
                    {g.description || "No description"}
                  </CardMeta>
                </div>
                <Button href={`/g/${g.id}`} variant="secondary">
                  Open
                </Button>
              </div>
              <div className="text-xs text-muted">
                TZ: {g.timezone} • Role: {g.role ?? "MEMBER"} • Your month:{" "}
                {g.my_month_count}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


