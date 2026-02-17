"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/cn";
import { TopBar } from "@/components/nav/TopBar";
import { Button } from "@/components/ui/Button";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { SetCurrentGroup } from "@/components/group/SetCurrentGroup";
import { RoutineCard } from "@/components/group/RoutineCard";
import { CheckInCard } from "@/components/group/CheckInCard";
import { PendingApprovals } from "@/components/group/PendingApprovals";
import { GroupInfoSheet } from "@/components/group/GroupInfoSheet";
import { ActivityFeed, type ActivityItem } from "@/components/group/ActivityFeed";
import { XPProgressBar } from "@/components/xp";

type Member = {
  user_id: string;
  role: string;
  users: { name: string; avatar_url: string | null } | null;
};

type Location = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
};

type PendingItem = {
  id: string;
  user_id: string;
  checkin_date: string;
  created_at: string;
  users: { name: string } | null;
};

type LeaderboardRow = {
  user_id: string;
  name: string;
  count: number;
};

export function GroupDashboard({
  groupId,
  groupName,
  description,
  timezone,
  routineUrl,
  contentType,
  routineName,
  routineDeadline,
  isAdmin,
  userId,
  members,
  locations,
  myMonthCount,
  streak,
  lastMonthWinnerName,
  leaderboard,
  pending,
  todayActivity,
  todayHypesReceived,
  xpInfo
}: {
  groupId: string;
  groupName: string;
  description: string | null;
  timezone: string;
  routineUrl: string | null;
  contentType: string | null;
  routineName: string | null;
  routineDeadline: string | null;
  isAdmin: boolean;
  userId: string;
  members: Member[];
  locations: Location[];
  myMonthCount: number;
  streak: number;
  lastMonthWinnerName: string | null;
  leaderboard: LeaderboardRow[];
  pending: PendingItem[];
  todayActivity: ActivityItem[];
  todayHypesReceived: number;
  xpInfo: {
    total_xp: number;
    current_level: number;
    level_title: string;
    level_color: string;
    xp_for_current_level: number;
    xp_for_next_level: number;
    progress_percent: number;
  } | null;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="space-y-3">
      <SetCurrentGroup groupId={groupId} />

      <TopBar
        title={groupName}
        right={
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSheetOpen(true)}
              className="flex h-10 items-center justify-center rounded-xl px-3 text-muted hover:text-text transition-colors"
            >
              <Info size={20} />
            </button>
            <Button href="/groups" variant="ghost">
              Groups
            </Button>
          </div>
        }
      />

      {/* Stats Card - Different for trainers vs clients */}
      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle>This month</CardTitle>
          <p className="text-xs text-muted">
            {members.length - 1} client{members.length - 1 !== 1 ? "s" : ""}
          </p>
        </div>
        {!isAdmin && (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/10 bg-card2 px-3 py-3">
              <p className="text-xs text-muted">Check-ins</p>
              <p className="text-2xl font-bold">{myMonthCount}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-card2 px-3 py-3">
              <p className="text-xs text-muted">Streak</p>
              <p className="text-2xl font-bold">{streak}</p>
            </div>
          </div>
        )}
        {!isAdmin && todayHypesReceived > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2">
            <span className="text-base">🔥</span>
            <p className="text-sm text-red-400">
              You received <span className="font-bold">{todayHypesReceived}</span> hype{todayHypesReceived !== 1 ? "s" : ""} today!
            </p>
          </div>
        )}
        {!isAdmin && xpInfo && (
          <XPProgressBar
            currentXP={xpInfo.total_xp}
            currentLevel={xpInfo.current_level}
            levelTitle={xpInfo.level_title}
            levelColor={xpInfo.level_color}
            xpForCurrentLevel={xpInfo.xp_for_current_level}
            xpForNextLevel={xpInfo.xp_for_next_level}
            progressPercent={xpInfo.progress_percent}
          />
        )}
        {lastMonthWinnerName ? (
          <p className="text-xs text-muted">
            Last month winner:{" "}
            <span className="font-semibold text-text">{lastMonthWinnerName}</span>
          </p>
        ) : null}
      </Card>

      <RoutineCard
        groupId={groupId}
        routineUrl={routineUrl}
        contentType={contentType}
        routineName={routineName}
        routineDeadline={routineDeadline}
        isAdmin={isAdmin}
      />

      {/* Trainers don't check in - they only approve */}
      {!isAdmin && (
        <CheckInCard
          groupId={groupId}
          timezone={timezone}
          userId={userId}
          locations={locations}
        />
      )}

      <ActivityFeed items={todayActivity} currentUserId={userId} />

      <PendingApprovals
        items={pending}
        isAdmin={isAdmin}
        groupId={groupId}
        timezone={timezone}
        currentUserId={userId}
      />

      {/* Leaderboard */}
      <Card className="space-y-2">
        <CardTitle>Leaderboard</CardTitle>
        {!leaderboard.length ? (
          <CardMeta>No check-ins yet this month.</CardMeta>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((row, idx) => {
              const medal =
                idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
              const isTop3 = idx < 3;

              return (
                <div
                  key={row.user_id}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-3 py-2",
                    isTop3
                      ? "border-white/15 bg-card2"
                      : "border-white/10 bg-card2"
                  )}
                >
                  <p className="truncate text-sm">
                    {medal ? (
                      <span className="mr-1">{medal}</span>
                    ) : (
                      <span className="text-muted">{idx + 1}.</span>
                    )}{" "}
                    <span className={cn("font-semibold", isTop3 && "text-text")}>
                      {row.name}
                    </span>
                  </p>
                  <p className={cn("text-sm font-semibold", isTop3 && "text-text")}>
                    {row.count}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Group Info Sheet */}
      <GroupInfoSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        groupId={groupId}
        groupName={groupName}
        description={description}
        timezone={timezone}
        members={members}
        locations={locations}
        isAdmin={isAdmin}
        userId={userId}
      />
    </div>
  );
}
