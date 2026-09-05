"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const { t } = useTranslation("profile");

  const canInstall = useMemo(() => !!evt && !dismissed, [evt, dismissed]);

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault?.();
      setEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (!canInstall) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 mx-auto w-full max-w-md px-3">
      <Card className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{t("installApp")}</p>
          <p className="text-xs text-muted">{t("installHint")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setDismissed(true)}
            className="h-10 px-3 text-xs"
          >
            {t("common:notNow")}
          </Button>
          <Button
            onClick={async () => {
              if (!evt) return;
              await evt.prompt();
              await evt.userChoice;
              setEvt(null);
            }}
            className="h-10 px-3 text-xs"
          >
            {t("common:install")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
