"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useToast } from "@/components/ui/Toast";
import { humanizeError } from "@/lib/errors";
import i18n from "@/lib/i18n";

const MapPicker = dynamic(
  () => import("@/components/ui/MapPicker").then((mod) => mod.MapPicker),
  { ssr: false, loading: () => <div className="h-[250px] rounded-xl border border-white/10 bg-card2 flex items-center justify-center"><p className="text-sm text-muted">{i18n.t("groups:loadingMap")}</p></div> }
);

type Location = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
};

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
  const { t } = useTranslation(["groups", "common"]);

  const [name, setName] = useState("");
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState("500");
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-3">
      <Card className="space-y-3">
        <div>
          <CardTitle>{t("groups:addLocation")}</CardTitle>
          <CardMeta>{t("groups:tapMap")}</CardMeta>
        </div>

        <div className="space-y-2">
          <label htmlFor="loc-name" className="text-xs text-muted">{t("common:name")}</label>
          <Input id="loc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("groups:mainGymPlaceholder")} />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted">{t("groups:locationLabel")}</label>
          <MapPicker value={position} onChange={setPosition} />
        </div>

        <div className="space-y-2">
          <label htmlFor="loc-radius" className="text-xs text-muted">{t("groups:radiusMeters")}</label>
          <Input id="loc-radius" value={radius} onChange={(e) => setRadius(e.target.value)} placeholder="500" />
        </div>

        <Button
          size="lg"
          disabled={
            busy ||
            !name.trim() ||
            !position ||
            !radius.trim() ||
            !isValidRadius(Number(radius))
          }
          onClick={async () => {
            if (!position) {
              push({ type: "error", message: t("groups:selectLocationError") });
              return;
            }

            const radiusNum = Number(radius);
            if (!isValidRadius(radiusNum)) {
              push({ type: "error", message: t("groups:radiusError") });
              return;
            }

            try {
              setBusy(true);
              const { error } = await supabase.from("gym_locations").insert({
                group_id: groupId,
                name: name.trim(),
                lat: position.lat,
                lng: position.lng,
                radius_m: Math.floor(radiusNum)
              });
              if (error) throw error;
              push({ type: "success", message: t("groups:locationAdded") });
              setName("");
              setPosition(null);
              setRadius("500");
              router.refresh();
            } catch (e: any) {
              push({ type: "error", message: humanizeError(e) });
            } finally {
              setBusy(false);
            }
          }}
        >
          {t("groups:addLocation")}
        </Button>
      </Card>

      <Card className="space-y-2">
        <CardTitle>{t("groups:existingLocations")}</CardTitle>
        {!initial.length ? (
          <CardMeta>{t("groups:noLocationsYet")}</CardMeta>
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
                    if (!confirm(t("groups:deleteConfirm", { name: l.name }))) return;
                    try {
                      setBusy(true);
                      const { error } = await supabase
                        .from("gym_locations")
                        .delete()
                        .eq("id", l.id);
                      if (error) throw error;
                      push({ type: "success", message: t("groups:deleted") });
                      router.refresh();
                    } catch (e: any) {
                      push({ type: "error", message: humanizeError(e) });
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {t("common:delete")}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
