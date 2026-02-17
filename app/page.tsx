import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth";

export default async function Home() {
  const profile = await getUserProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.user_type === "TRAINER") {
    redirect("/trainer");
  }

  redirect("/dashboard");
}




