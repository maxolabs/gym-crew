import { requireUserProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { GroupsContent } from "@/components/groups/GroupsContent";
import { monthRangeInTz } from "@/lib/time";

export default async function GroupsPage() {
  const profile = await requireUserProfile();
  const supabase = await supabaseServer();

  const { start, end } = monthRangeInTz("UTC");

  const { data: withStats } = await supabase.rpc("get_my_groups_with_stats", {
    p_month_start: start,
    p_month_end: end
  });

  const isTrainer = profile.user_type === "TRAINER";

  return (
    <GroupsContent
      isTrainer={isTrainer}
      withStats={withStats as any}
    />
  );
}
