"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { TopBar } from "@/components/nav/TopBar";
import { Button } from "@/components/ui/Button";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { SetCurrentGroup } from "@/components/group/SetCurrentGroup";
import { RoutineCard } from "@/components/group/RoutineCard";
import { CheckInCard } from "@/components/group/CheckInCard";
import { PendingApprovals } from "@/components/group/PendingApprovals";
import { GroupInfoSheet } from "@/components/group/GroupInfoSheet";

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
  pending
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

      {/* Stats Card - Compact */}
      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle>This month</CardTitle>
          <p className="text-xs text-muted">{members.length} members</p>
        </div>
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

      <CheckInCard
        groupId={groupId}
        timezone={timezone}
        userId={userId}
        locations={locations}
      />

      <PendingApprovals items={pending} isAdmin={isAdmin} />

      {/* Leaderboard */}
      <Card className="space-y-2">
        <CardTitle>Leaderboard</CardTitle>
        {!leaderboard.length ? (
          <CardMeta>No check-ins yet this month.</CardMeta>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((row, idx) => (
              <div
                key={row.user_id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-card2 px-3 py-2"
              >
                <p className="truncate text-sm">
                  <span className="text-muted">{idx + 1}.</span>{" "}
                  <span className="font-semibold">{row.name}</span>
                </p>
                <p className="text-sm font-semibold">{row.count}</p>
              </div>
            ))}
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
