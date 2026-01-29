import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import type { User, UserType } from "@/lib/supabase/types";

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

export type UserProfile = User & { email?: string };

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await supabaseServer();
  const {
    data: { user: authUser }
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (!profile) {
    // Auth user exists but profile doesn't (database was reset)
    // Sign out to clear stale session
    await supabase.auth.signOut();
    return null;
  }

  return { ...profile, email: authUser.email };
}

export async function requireUserProfile(): Promise<UserProfile> {
  const profile = await getUserProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function isTrainer(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.user_type === "TRAINER";
}

export async function requireTrainer(): Promise<UserProfile> {
  const profile = await requireUserProfile();
  if (profile.user_type !== "TRAINER") {
    redirect("/dashboard");
  }
  return profile;
}

export function getUserTypeFromProfile(profile: UserProfile | null): UserType {
  return (profile?.user_type as UserType) ?? "USER";
}


