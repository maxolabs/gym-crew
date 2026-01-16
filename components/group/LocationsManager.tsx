"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useToast } from "@/components/ui/Toast";
import { humanizeError } from "@/lib/errors";

type Location = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
};

function isValidLat(lat: number): boolean {
  return !Number.isNaN(lat) && lat >= -90 && lat <= 90;
}

function isValidLng(lng: number): boolean {
  return !Number.isNaN(lng) && lng >= -180 && lng <= 180;
}

function isValidRadius(radius: number): boolean {
  return !Number.isNaN(radius) && radius >= 1 && radius <= 50000;
}

export function LocationsManager({
  groupId,
  initial
}: {
  groupId: string;
  initial: Location[];
}) {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const { push } = useToast();

  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState("500");
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-3">
      <Card className="space-y-3">
        <div>
          <CardTitle>Add location</CardTitle>
          <CardMeta>Tip: use Google Maps to copy coordinates.</CardMeta>
        </div>

        <div className="space-y-2">
          <label htmlFor="loc-name" className="text-xs text-muted">Name</label>
          <Input id="loc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Main gym" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <label htmlFor="loc-lat" className="text-xs text-muted">Lat</label>
            <Input id="loc-lat" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="37.7749" />
          </div>
          <div className="space-y-2">
            <label htmlFor="loc-lng" className="text-xs text-muted">Lng</label>
            <Input id="loc-lng" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-122.4194" />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="loc-radius" className="text-xs text-muted">Radius (meters)</label>
          <Input id="loc-radius" value={radius} onChange={(e) => setRadius(e.target.value)} placeholder="500" />
        </div>

        <Button
          size="lg"
          disabled={
            busy ||
            !name.trim() ||
            !lat.trim() ||
            !lng.trim() ||
            !radius.trim() ||
            !isValidLat(Number(lat)) ||
            !isValidLng(Number(lng)) ||
            !isValidRadius(Number(radius))
          }
          onClick={async () => {
            const latNum = Number(lat);
            const lngNum = Number(lng);
            const radiusNum = Number(radius);

            if (!isValidLat(latNum)) {
              push({ type: "error", message: "Latitude must be between -90 and 90." });
              return;
            }
            if (!isValidLng(lngNum)) {
              push({ type: "error", message: "Longitude must be between -180 and 180." });
              return;
            }
            if (!isValidRadius(radiusNum)) {
              push({ type: "error", message: "Radius must be between 1 and 50,000 meters." });
              return;
            }

            try {
              setBusy(true);
              const { error } = await supabase.from("gym_locations").insert({
                group_id: groupId,
                name: name.trim(),
                lat: latNum,
                lng: lngNum,
                radius_m: Math.floor(radiusNum)
              });
              if (error) throw error;
              push({ type: "success", message: "Location added." });
              setName("");
              setLat("");
              setLng("");
              setRadius("500");
              router.refresh();
            } catch (e: any) {
              push({ type: "error", message: humanizeError(e) });
            } finally {
              setBusy(false);
            }
          }}
        >
          Add location
        </Button>
      </Card>

      <Card className="space-y-2">
        <CardTitle>Existing locations</CardTitle>
        {!initial.length ? (
          <CardMeta>No locations yet.</CardMeta>
        ) : (
          <div className="space-y-2">
            {initial.map((l) => (
              <div
                key={l.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-card2 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{l.name}</p>
                  <p className="text-xs text-muted">
                    {l.lat.toFixed(5)}, {l.lng.toFixed(5)} • {l.radius_m}m
                  </p>
                </div>
                <Button
                  variant="danger"
                  className="h-10 px-3 text-xs"
                  disabled={busy}
                  onClick={async () => {
                    if (!confirm(`Delete "${l.name}"?`)) return;
                    try {
                      setBusy(true);
                      const { error } = await supabase
                        .from("gym_locations")
                        .delete()
                        .eq("id", l.id);
                      if (error) throw error;
                      push({ type: "success", message: "Deleted." });
                      router.refresh();
                    } catch (e: any) {
                      push({ type: "error", message: humanizeError(e) });
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}



