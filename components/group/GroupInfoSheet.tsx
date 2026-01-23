"use client";

import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { InviteLinkCard } from "./InviteLinkCard";
import { LeaveGroupButton } from "./LeaveGroupButton";

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

export function GroupInfoSheet({
  open,
  onClose,
  groupId,
  groupName,
  description,
  timezone,
  members,
  locations,
  isAdmin,
  userId
}: {
  open: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  description: string | null;
  timezone: string;
  members: Member[];
  locations: Location[];
  isAdmin: boolean;
  userId: string;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Group Info">
      {/* Overview */}
      {description ? (
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-muted">About</h3>
          <p className="text-sm">{description}</p>
          <p className="text-xs text-muted">Timezone: {timezone}</p>
        </div>
      ) : (
        <p className="text-xs text-muted">Timezone: {timezone}</p>
      )}

      {/* Members */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted">
            Members ({members.length})
          </h3>
        </div>
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.user_id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-card2 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {m.users?.name ?? m.user_id}
                </p>
                <p className="text-xs text-muted">{m.role}</p>
              </div>
              {m.user_id === userId ? (
                <span className="text-xs text-muted">You</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Locations */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted">
            Locations ({locations.length})
          </h3>
          {isAdmin ? (
            <Button
              href={`/g/${groupId}/locations`}
              variant="secondary"
              className="text-xs"
            >
              Manage
            </Button>
          ) : null}
        </div>
        {locations.length ? (
          <div className="space-y-2">
            {locations.map((l) => (
              <div
                key={l.id}
                className="rounded-xl border border-white/10 bg-card2 px-3 py-2"
              >
                <p className="text-sm font-semibold">{l.name}</p>
                <p className="text-xs text-muted">
                  Radius: {l.radius_m}m
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted">
            No locations set. Check-ins need at least one location.
          </p>
        )}
      </div>

      {/* Invite Link (Admin only) */}
      {isAdmin ? (
        <InviteLinkCard groupId={groupId} />
      ) : null}

      {/* Leave Group */}
      <div className="pt-2 border-t border-white/10">
        <LeaveGroupButton
          groupId={groupId}
          userId={userId}
          isAdmin={isAdmin}
          memberCount={members.length}
        />
      </div>
    </Sheet>
  );
}
