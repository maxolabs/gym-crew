"use client";

import { useTranslation } from "react-i18next";
import { TopBar } from "@/components/nav/TopBar";
import { Button } from "@/components/ui/Button";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { RoutineUploader } from "@/components/group/RoutineUploader";

type Props = {
  groupId: string;
  isAdmin: boolean;
  hasRoutine: boolean;
  routineSignedUrl: string | null;
  routineContentType: string | null;
  routineName: string | null;
  routineDeadline: string | null;
};

export function RoutinePageContent({
  groupId,
  isAdmin,
  hasRoutine,
  routineSignedUrl,
  routineContentType,
  routineName,
  routineDeadline
}: Props) {
  const { t } = useTranslation(["groups", "common"]);

  return (
    <div className="space-y-3">
      <TopBar
        title={t("groups:manageRoutine")}
        right={
          <Button href={`/g/${groupId}`} variant="ghost">
            {t("common:back")}
          </Button>
        }
      />

      {!isAdmin ? (
        <Card className="space-y-2">
          <CardTitle>{t("groups:adminsOnly")}</CardTitle>
          <CardMeta>{t("groups:noRoutinePermission")}</CardMeta>
        </Card>
      ) : (
        <Card className="space-y-4">
          <div>
            <CardTitle>
              {hasRoutine ? t("groups:updateRoutine") : t("groups:uploadRoutine")}
            </CardTitle>
            <CardMeta>
              {t("groups:uploadRoutineHint")}
            </CardMeta>
          </div>
          <RoutineUploader
            groupId={groupId}
            currentUrl={routineSignedUrl}
            contentType={routineContentType}
            currentName={routineName}
            currentDeadline={routineDeadline}
          />
        </Card>
      )}
    </div>
  );
}
