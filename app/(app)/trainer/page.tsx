import { requireTrainer } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { TrainerDashboardContent } from "@/components/trainer/TrainerDashboardContent";

export default async function TrainerDashboardPage() {
  const profile = await requireTrainer();
  const supabase = await supabaseServer();

  const { data: groups } = await supabase
    .from("gym_groups")
    .select(
      `
      id,
      name,
      routine_deadline,
      routine_name,
      group_members(count)
    `
    )
    .eq("created_by", profile.id)
    .order("created_at", { ascending: false });

  const totalClients =
    groups?.reduce((sum, g) => {
      const count = (g.group_members as unknown as { count: number }[])?.[0]?.count ?? 0;
      return sum + Math.max(0, count - 1);
    }, 0) ?? 0;

  const { count: pendingCount } = await supabase
    .from("check_ins")
    .select("id", { count: "exact", head: true })
    .eq("method", "MANUAL")
    .eq("status", "PENDING")
    .in(
      "group_id",
      groups?.map((g) => g.id) ?? []
    );

  const expiredRoutines =
    groups?.filter(
      (g) => g.routine_deadline && new Date(g.routine_deadline) < new Date()
    ).length ?? 0;

  const mappedGroups = (groups ?? []).map((g) => {
    const memberCount = (g.group_members as unknown as { count: number }[])?.[0]?.count ?? 0;
    return {
      id: g.id,
      name: g.name,
      routine_deadline: g.routine_deadline,
      routine_name: g.routine_name,
      clientCount: Math.max(0, memberCount - 1)
    };
  });

  return (
    <TrainerDashboardContent
      groups={mappedGroups}
      totalClients={totalClients}
      pendingCount={pendingCount ?? 0}
      expiredRoutines={expiredRoutines}
    />
  );
}
