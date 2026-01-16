import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export async function getUser() {
  const supabase = await supabaseServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}


