"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { todayInTz } from "@/lib/time";
import { distanceMeters, formatDistance } from "@/lib/geo";
import { useToast } from "@/components/ui/Toast";
import { humanizeError } from "@/lib/errors";

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
  const { push } = useToast();

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

    const { error } = await supabase.from("check_ins").insert({
      group_id: groupId,
      user_id: userId,
      checkin_date: today,
      method: "GEO",
      status: "APPROVED",
      lat,
      lng
    });
    if (error) throw error;
    setTodayStatus({ status: "APPROVED", method: "GEO" });
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


