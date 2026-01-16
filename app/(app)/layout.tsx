import { BottomTabs } from "@/components/nav/BottomTabs";
import type React from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-md px-3 pb-28 pt-4">
      {children}
      <BottomTabs />
    </div>
  );
}


