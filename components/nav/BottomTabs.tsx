"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Home, Layers, User, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/cn";
import type React from "react";

type Tab = {
  href: string;
  labelKey: string;
  icon: React.ReactNode;
  isActive: (pathname: string) => boolean;
};

const userTabs: Tab[] = [
  {
    href: "/dashboard",
    labelKey: "home",
    icon: <Home className="h-5 w-5" />,
    isActive: (p) => p === "/dashboard"
  },
  {
    href: "/groups",
    labelKey: "groups",
    icon: <Layers className="h-5 w-5" />,
    isActive: (p) => p === "/groups" || p.startsWith("/groups/") || p.startsWith("/g/")
  },
  {
    href: "/profile",
    labelKey: "profile",
    icon: <User className="h-5 w-5" />,
    isActive: (p) => p === "/profile"
  }
];

const trainerTabs: Tab[] = [
  {
    href: "/trainer",
    labelKey: "dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    isActive: (p) => p === "/trainer"
  },
  {
    href: "/trainer/groups",
    labelKey: "groups",
    icon: <Layers className="h-5 w-5" />,
    isActive: (p) =>
      p === "/trainer/groups" ||
      p.startsWith("/trainer/groups/") ||
      p.startsWith("/g/")
  },
  {
    href: "/profile",
    labelKey: "profile",
    icon: <User className="h-5 w-5" />,
    isActive: (p) => p === "/profile"
  }
];

type Props = {
  isTrainer?: boolean;
};

export function BottomTabs({ isTrainer = false }: Props) {
  const pathname = usePathname();
  const { t } = useTranslation("common");
  const tabs = isTrainer ? trainerTabs : userTabs;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-3 safe-pb">
        {tabs.map((tab) => {
          const active = tab.isActive(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-1 rounded-2xl py-3 text-xs",
                active ? "text-text" : "text-muted"
              )}
            >
              <span className={cn(active && "text-accent")}>{tab.icon}</span>
              <span className={cn(active && "font-semibold")}>{t(tab.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
