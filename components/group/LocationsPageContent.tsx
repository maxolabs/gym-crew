"use client";

import { useTranslation } from "react-i18next";
import { TopBar } from "@/components/nav/TopBar";
import { Button } from "@/components/ui/Button";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { LocationsManager } from "@/components/group/LocationsManager";

type Props = {
  groupId: string;
  isAdmin: boolean;
  locations: { id: string; name: string; lat: number; lng: number; radius_m: number }[];
};

export function LocationsPageContent({ groupId, isAdmin, locations }: Props) {
  const { t } = useTranslation(["groups", "common"]);

  return (
    <div className="space-y-3">
      <TopBar
        title={t("common:locations")}
        right={
          <Button href={`/g/${groupId}`} variant="ghost">
            {t("common:back")}
          </Button>
        }
      />

      {!isAdmin ? (
        <Card className="space-y-2">
          <CardTitle>{t("groups:adminsOnly")}</CardTitle>
          <CardMeta>{t("groups:noLocationPermission")}</CardMeta>
        </Card>
      ) : (
        <LocationsManager groupId={groupId} initial={locations} />
      )}
    </div>
  );
}
