"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { todayInTz } from "@/lib/time";
import { distanceMeters, formatDistance } from "@/lib/geo";
import { useToast } from "@/components/ui/Toast";
import { humanizeError } from "@/lib/errors";
import {
  checkAndAwardAchievements,
  getStreakForUser,
  getTotalCheckInsForUser
} from "@/lib/achievements";
import { getXPForCheckIn, XP_REWARDS } from "@/lib/xp-config";

type Location = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
};

type Props = {
  groupId: string;
  timezone: string;
  userId: string;
  locations: Location[];
};

export function CheckInCard({ groupId, timezone, userId, locations }: Props) {
  const supabase = supabaseBrowser();
  const { push, pushAchievement, pushXPGain, pushLevelUp } = useToast();

  const [loading, setLoading] = useState(true); // Start true to prevent actions before status is loaded
  const [todayStatus, setTodayStatus] = useState<null | {
    status: string;
    method: string;
  }>(null);
  const [statusLoaded, setStatusLoaded] = useState(false);

  const today = useMemo(() => todayInTz(timezone), [timezone]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("check_ins")
          .select("status,method")
          .eq("group_id", groupId)
          .eq("user_id", userId)
          .eq("checkin_date", today)
          .maybeSingle();
        if (data) setTodayStatus(data as any);
        else setTodayStatus(null);
      } finally {
        setStatusLoaded(true);
        setLoading(false);
      }
    })();
  }, [supabase, groupId, userId, today]);

  const createManual = async () => {
    const { error } = await supabase.from("check_ins").insert({
      group_id: groupId,
      user_id: userId,
      checkin_date: today,
      method: "MANUAL",
      status: "PENDING"
    });
    if (error) throw error;
    setTodayStatus({ status: "PENDING", method: "MANUAL" });
  };

  const handlePostCheckIn = async (isApproved: boolean, method: "GEO" | "MANUAL", checkInId?: string) => {
    if (!isApproved) return;

    try {
      // Get stats for achievement context and XP calculation
      const [streak, totalCheckIns] = await Promise.all([
        getStreakForUser(supabase, userId, groupId, timezone),
        getTotalCheckInsForUser(supabase, userId, groupId)
      ]);

      // Award XP for check-in
      const xpInfo = getXPForCheckIn(method, streak);
      const { data: xpResult } = await supabase.rpc("award_xp", {
        p_user_id: userId,
        p_amount: xpInfo.baseXP,
        p_source: "checkin",
        p_source_id: checkInId ?? null,
        p_multiplier: xpInfo.multiplier
      });

      const result = (xpResult as any)?.[0];
      if (result) {
        // Show XP gain toast
        pushXPGain({
          amount: xpInfo.totalXP,
          multiplier: xpInfo.multiplier > 1 ? xpInfo.multiplier : undefined
        });

        // Show level up toast if leveled up
        if (result.leveled_up) {
          // Small delay so XP toast shows first
          setTimeout(() => {
            pushLevelUp({
              newLevel: result.new_level,
              title: result.level_title,
              color: result.level_color
            });
          }, 500);
        }
      }

      // Check achievements
      const awarded = await checkAndAwardAchievements(supabase, userId, groupId, {
        currentStreak: streak,
        totalCheckIns,
        checkInTime: new Date(),
        isFirstCheckIn: totalCheckIns === 1
      });

      // Show achievement toast for first awarded (after XP toast)
      if (awarded.length > 0) {
        setTimeout(() => {
          pushAchievement({
            name: awarded[0].name,
            description: awarded[0].description,
            icon: awarded[0].icon,
            rarity: awarded[0].rarity,
            xp: awarded[0].xp
          });
        }, result?.leveled_up ? 1000 : 500);
      }
    } catch (err) {
      // Silently fail - XP and achievements are not critical
      console.error("Failed to process post-check-in rewards:", err);
    }
  };

  const createGeo = async (lat: number, lng: number) => {
    if (!locations.length) {
      push({
        type: "error",
        message: "No gym locations are set for this group. Ask an admin to add one."
      });
      return false;
    }

    const withDist = locations.map((loc) => ({
      loc,
      d: distanceMeters(lat, lng, loc.lat, loc.lng)
    }));
    withDist.sort((a, b) => a.d - b.d);
    const nearest = withDist[0]!;

    if (nearest.d > nearest.loc.radius_m) {
      push({
        type: "info",
        message: `Outside radius. Nearest: ${nearest.loc.name} (${formatDistance(nearest.d)} away).`
      });
      return false;
    }

    const { data: inserted, error } = await supabase
      .from("check_ins")
      .insert({
        group_id: groupId,
        user_id: userId,
        checkin_date: today,
        method: "GEO",
        status: "APPROVED",
        lat,
        lng
      })
      .select("id")
      .single();
    if (error) throw error;
    setTodayStatus({ status: "APPROVED", method: "GEO" });

    // Award XP and check for achievements after successful GPS check-in
    handlePostCheckIn(true, "GEO", inserted?.id);

    return true;
  };

  const already =
    todayStatus?.status === "APPROVED"
      ? "Checked in (approved)"
      : todayStatus?.status === "PENDING"
        ? "Check-in pending approval"
        : todayStatus?.status === "REJECTED"
          ? "Check-in rejected"
          : null;

  return (
    <Card className="space-y-3">
      <div>
        <CardTitle>Check In</CardTitle>
        <CardMeta>One check-in per day, per group. Today: {today}</CardMeta>
      </div>

      {already ? (
        <div className="rounded-xl border border-white/10 bg-card2 px-3 py-3">
          <p className="text-sm font-semibold">{already}</p>
          <p className="text-xs text-muted">
            Method: {todayStatus?.method ?? "—"}
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Button
          size="lg"
          disabled={loading || !statusLoaded || !!todayStatus}
          onClick={async () => {
            try {
              setLoading(true);
              const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                  resolve,
                  reject,
                  { enableHighAccuracy: true, timeout: 12000 }
                );
              });
              const didCheckIn = await createGeo(
                position.coords.latitude,
                position.coords.longitude
              );
              if (didCheckIn) push({ type: "success", message: "Checked in!" });
            } catch (e: any) {
              if (e?.code === 1) {
                push({
                  type: "error",
                  message: "Location permission denied. You can request a manual check-in."
                });
              } else if (String(e?.message || "").includes("duplicate key")) {
                push({ type: "info", message: "You've already checked in today." });
                setTodayStatus({ status: "APPROVED", method: "GEO" });
              } else {
                push({ type: "error", message: humanizeError(e) });
              }
            } finally {
              setLoading(false);
            }
          }}
        >
          {!statusLoaded ? "Loading..." : loading ? "Checking..." : "Check In (GPS)"}
        </Button>

        <Button
          size="lg"
          variant="secondary"
          disabled={loading || !statusLoaded || !!todayStatus}
          onClick={async () => {
            try {
              setLoading(true);
              await createManual();
              push({ type: "success", message: "Manual request submitted (needs approval)." });
            } catch (e: any) {
              if (String(e?.message || "").includes("duplicate key")) {
                push({ type: "info", message: "You've already checked in today." });
                setTodayStatus({ status: "PENDING", method: "MANUAL" });
              } else {
                push({ type: "error", message: humanizeError(e) });
              }
            } finally {
              setLoading(false);
            }
          }}
        >
          Request Manual Check-In
        </Button>
      </div>
    </Card>
  );
}


