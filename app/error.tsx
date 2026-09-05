"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation("errors");

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md items-center px-3 py-10">
      <Card className="w-full space-y-3">
        <CardTitle>{t("somethingWentWrong")}</CardTitle>
        <CardMeta>
          {error.message || t("unexpectedError")}
        </CardMeta>
        <div className="flex gap-2">
          <Button size="lg" onClick={() => reset()}>
            {t("tryAgain")}
          </Button>
          <Button size="lg" variant="secondary" href="/groups">
            {t("common:groups")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
