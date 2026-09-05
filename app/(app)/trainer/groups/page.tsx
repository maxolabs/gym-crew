import { requireTrainer } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { TrainerGroupsContent } from "@/components/trainer/TrainerGroupsContent";

export default async function TrainerGroupsPage() {
  const profile = await requireTrainer();
  const supabase = await supabaseServer();

  const { data: groups } = await supabase
    .from("gym_groups")
    .select(
      `
      id,
      name,
      description,
      timezone,
      routine_url,
      routine_name,
      routine_deadline,
      created_at,
      group_members(count)
    `
    )
    .eq("created_by", profile.id)
    .order("created_at", { ascending: false });

  const mappedGroups = (groups ?? []).map((g) => {
    const memberCount = (g.group_members as unknown as { count: number }[])?.[0]?.count ?? 0;
    return {
      id: g.id,
      name: g.name,
      description: g.description,
      timezone: g.timezone,
      routine_url: g.routine_url,
      routine_name: g.routine_name,
      routine_deadline: g.routine_deadline,
      clientCount: Math.max(0, memberCount - 1)
    };
  });

  return <TrainerGroupsContent groups={mappedGroups} />;
}
