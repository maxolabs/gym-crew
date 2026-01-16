"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Layers, User } from "lucide-react";
import { cn } from "@/lib/cn";
import type React from "react";

type Tab = {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: (pathname: string) => boolean;
};

const tabs: Tab[] = [
  {
    href: "/groups",
    label: "Groups",
    icon: <Layers className="h-5 w-5" />,
    isActive: (p) => p === "/groups" || p.startsWith("/groups/")
  },
  {
    href: "/current",
    label: "Current",
    icon: <Dumbbell className="h-5 w-5" />,
    isActive: (p) => p === "/current" || p.startsWith("/g/")
  },
  {
    href: "/profile",
    label: "Profile",
    icon: <User className="h-5 w-5" />,
    isActive: (p) => p === "/profile"
  }
];

export function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-3 safe-pb">
        {tabs.map((t) => {
          const active = t.isActive(pathname);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-1 rounded-2xl py-3 text-xs",
                active ? "text-text" : "text-muted"
              )}
            >
              <span className={cn(active && "text-accent")}>{t.icon}</span>
              <span className={cn(active && "font-semibold")}>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}


