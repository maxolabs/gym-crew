"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers, User, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/cn";
import type React from "react";

type Tab = {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: (pathname: string) => boolean;
};

const userTabs: Tab[] = [
  {
    href: "/dashboard",
    label: "Home",
    icon: <Home className="h-5 w-5" />,
    isActive: (p) => p === "/dashboard"
  },
  {
    href: "/groups",
    label: "Groups",
    icon: <Layers className="h-5 w-5" />,
    isActive: (p) => p === "/groups" || p.startsWith("/groups/") || p.startsWith("/g/")
  },
  {
    href: "/profile",
    label: "Profile",
    icon: <User className="h-5 w-5" />,
    isActive: (p) => p === "/profile"
  }
];

const trainerTabs: Tab[] = [
  {
    href: "/trainer",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    isActive: (p) => p === "/trainer"
  },
  {
    href: "/trainer/groups",
    label: "Groups",
    icon: <Layers className="h-5 w-5" />,
    isActive: (p) =>
      p === "/trainer/groups" ||
      p.startsWith("/trainer/groups/") ||
      p.startsWith("/g/")
  },
  {
    href: "/profile",
    label: "Profile",
    icon: <User className="h-5 w-5" />,
    isActive: (p) => p === "/profile"
  }
];

type Props = {
  isTrainer?: boolean;
};

export function BottomTabs({ isTrainer = false }: Props) {
  const pathname = usePathname();
  const tabs = isTrainer ? trainerTabs : userTabs;

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
