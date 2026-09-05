"use client";

import { useTranslation } from "react-i18next";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { HypeButton } from "@/components/group/HypeButton";

export type ActivityItem = {
  id: string;
  user_id: string;
  user_name: string;
  method: string;
  created_at: string;
  hype_count: number;
  user_hyped: boolean;
  group_name?: string;
};

type Props = {
  items: ActivityItem[];
  currentUserId: string;
  showGroupName?: boolean;
};

function useTimeAgo() {
  const { t } = useTranslation("groups");

  return (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("justNow");
    if (mins < 60) return t("minutesAgo", { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t("hoursAgo", { count: hours });
    return t("daysAgo", { count: Math.floor(hours / 24) });
  };
}

function UserInitial({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
      {initial}
    </div>
  );
}

export function ActivityFeed({ items, currentUserId, showGroupName }: Props) {
  const { t } = useTranslation(["groups", "common"]);
  const timeAgo = useTimeAgo();

  return (
    <Card className="space-y-3">
      <CardTitle>{showGroupName ? t("groups:recentActivity") : t("groups:todaysActivity")}</CardTitle>

      {!items.length ? (
        <CardMeta>{t("groups:noActivity")}</CardMeta>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-card2 px-3 py-2"
            >
              <UserInitial name={item.user_name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.user_name}</p>
                <p className="text-xs text-muted">
                  {timeAgo(item.created_at)}
                  {" · "}
                  <span
                    className={
                      item.method === "GEO"
                        ? "text-accent"
                        : "text-muted"
                    }
                  >
                    {item.method === "GEO" ? t("common:gps") : t("common:manual")}
                  </span>
                  {showGroupName && item.group_name && (
                    <> · {item.group_name}</>
                  )}
                </p>
              </div>
              <HypeButton
                checkInId={item.id}
                checkInUserId={item.user_id}
                currentUserId={currentUserId}
                initialCount={item.hype_count}
                initialHyped={item.user_hyped}
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
