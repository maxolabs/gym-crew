"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function CurrentGroupPage() {
  const router = useRouter();
  const { t } = useTranslation(["groups", "errors"]);

  useEffect(() => {
    const last = window.localStorage.getItem("gymcrew:lastGroupId");
    if (last) router.replace(`/g/${last}`);
  }, [router]);

  return (
    <Card className="space-y-3">
      <CardTitle>{t("groups:noCurrentGroup")}</CardTitle>
      <CardMeta>{t("groups:noCurrentGroupDesc")}</CardMeta>
      <Button href="/groups" size="lg">
        {t("errors:goToGroups")}
      </Button>
    </Card>
  );
}
