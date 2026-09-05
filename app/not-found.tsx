"use client";

import { useTranslation } from "react-i18next";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  const { t } = useTranslation("errors");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md items-center px-3 py-10">
      <Card className="w-full space-y-3">
        <CardTitle>{t("notFound")}</CardTitle>
        <CardMeta>{t("notFoundDesc")}</CardMeta>
        <Button href="/groups" size="lg">
          {t("goToGroups")}
        </Button>
      </Card>
    </div>
  );
}
