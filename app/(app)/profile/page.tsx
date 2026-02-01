import { requireUserProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { TopBar } from "@/components/nav/TopBar";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Award, Trophy, ChevronRight } from "lucide-react";
import { AchievementBadge } from "@/components/achievements/AchievementBadge";
import type { AchievementDefinition } from "@/lib/achievements/types";

export default async function ProfilePage() {
  const profile = await requireUserProfile();
  const supabase = await supabaseServer();

  const isTrainer = profile.user_type === "TRAINER";

  const [{ count: groupCount }, { count: totalApproved }] = await Promise.all([
    supabase
      .from("group_members")
      .select("group_id", { count: "exact", head: true })
      .eq("user_id", profile.id),
    supabase
      .from("check_ins")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("status", "APPROVED")
  ]);

  const [{ data: badges }, { data: recentAchievements }, { data: achievementXp }] = await Promise.all([
    supabase
      .from("badges")
      .select("id,group_id,badge_type,period_start,period_end,created_at,gym_groups(name)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("user_achievements")
      .select("id,earned_at,achievement_definitions(*)")
      .eq("user_id", profile.id)
      .order("earned_at", { ascending: false })
      .limit(3),
    supabase.rpc("get_user_achievement_xp", { p_user_id: profile.id })
  ]);

  const totalXp = (achievementXp as number) ?? 0;

  return (
    <div className="space-y-3">
      <TopBar title="Profile" right={<LogoutButton />} />

      <Card className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar
            src={profile.avatar_url}
            name={profile.name}
            size="lg"
            showTrainerBadge={isTrainer}
          />
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">{profile.name}</CardTitle>
            <CardMeta className="truncate">{profile.email}</CardMeta>
            <span
              className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isTrainer
                  ? "bg-accent/10 text-accent"
                  : "bg-card2 text-muted"
              }`}
            >
              {isTrainer ? "Trainer" : "Client"}
            </span>
          </div>
        </div>
      </Card>

      <Card className="space-y-2">
        <CardTitle>Stats</CardTitle>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-white/10 bg-card2 px-3 py-3">
            <p className="text-xs text-muted">
              {isTrainer ? "Groups" : "Groups"}
            </p>
            <p className="text-2xl font-bold">{groupCount ?? 0}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-card2 px-3 py-3">
            <p className="text-xs text-muted">Check-ins</p>
            <p className="text-2xl font-bold">{totalApproved ?? 0}</p>
          </div>
          <div className="rounded-xl border border-accent/20 bg-accent/5 px-3 py-3">
            <p className="text-xs text-accent">Total XP</p>
            <p className="text-2xl font-bold text-accent">{totalXp}</p>
          </div>
        </div>
      </Card>

      {/* Achievements Section */}
      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle>Achievements</CardTitle>
          <Button
            href="/achievements"
            variant="ghost"
            className="h-8 gap-1 px-2 text-xs text-muted"
          >
            View All
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {!recentAchievements?.length ? (
          <CardMeta>No achievements yet — check in to start earning!</CardMeta>
        ) : (
          <div className="space-y-2">
            {recentAchievements.map((ua: any) => (
              <AchievementBadge
                key={ua.id}
                achievement={ua.achievement_definitions as AchievementDefinition}
                earned={true}
                size="sm"
              />
            ))}
          </div>
        )}
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
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-card2 p-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning">
                  <Award className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {b.badge_type === "MONTH_WINNER" ? "Month Winner" : b.badge_type}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {b.gym_groups?.name} •{" "}
                    {new Date(b.period_start).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric"
                    })}
                  </p>
                </div>
                <Button
                  href={`/g/${b.group_id}`}
                  variant="ghost"
                  className="h-9 shrink-0 px-3 text-xs"
                >
                  View
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {isTrainer && (
        <Card className="space-y-2">
          <CardTitle>Trainer Actions</CardTitle>
          <div className="flex gap-2">
            <Button href="/trainer" variant="secondary" className="flex-1">
              Dashboard
            </Button>
            <Button href="/trainer/groups" variant="secondary" className="flex-1">
              Manage Groups
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
