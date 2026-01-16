import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { TopBar } from "@/components/nav/TopBar";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = await supabaseServer();

  const { data: profile } = await supabase
    .from("users")
    .select("id,name,avatar_url,created_at")
    .eq("id", user.id)
    .maybeSingle();

  const [{ count: groupCount }, { count: totalApproved }] = await Promise.all([
    supabase
      .from("group_members")
      .select("group_id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("check_ins")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "APPROVED")
  ]);

  const { data: badges } = await supabase
    .from("badges")
    .select("id,group_id,badge_type,period_start,period_end,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-3">
      <TopBar
        title="Profile"
        right={<LogoutButton />}
      />

      <Card className="space-y-2">
        <CardTitle>{profile?.name ?? "You"}</CardTitle>
        <CardMeta>{user.email}</CardMeta>
      </Card>

      <Card className="space-y-2">
        <CardTitle>Global stats</CardTitle>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-card2 px-3 py-3">
            <p className="text-xs text-muted">Groups</p>
            <p className="text-2xl font-bold">{groupCount ?? 0}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-card2 px-3 py-3">
            <p className="text-xs text-muted">Approved check-ins</p>
            <p className="text-2xl font-bold">{totalApproved ?? 0}</p>
          </div>
        </div>
      </Card>

      <Card className="space-y-2">
        <CardTitle>Badges</CardTitle>
        {!badges?.length ? (
          <CardMeta>No badges yet — win a month in a group.</CardMeta>
        ) : (
          <div className="space-y-2">
            {badges.map((b: any) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-card2 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{b.badge_type}</p>
                  <p className="truncate text-xs text-muted">
                    {b.period_start} → {b.period_end}
                  </p>
                </div>
                <Button href={`/g/${b.group_id}`} variant="ghost" className="h-9 px-3 text-xs">
                  View
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}


