import { BottomTabs } from "@/components/nav/BottomTabs";
import { getUserProfile } from "@/lib/auth";
import type React from "react";

export default async function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const profile = await getUserProfile();
  const isTrainer = profile?.user_type === "TRAINER";

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md px-3 pb-28 pt-4">
      {children}
      <BottomTabs isTrainer={isTrainer} />
    </div>
  );
}
