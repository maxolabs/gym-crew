"use client";

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import { Zap } from "lucide-react";

type Props = {
  amount: number;
  multiplier?: number;
  className?: string;
};

export function XPGainToast({ amount, multiplier, className }: Props) {
  const { t } = useTranslation("profile");
  const hasMultiplier = multiplier && multiplier > 1;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-accent shadow-lg",
        className
      )}
    >
      <Zap className="h-4 w-4" />
      <span className="font-bold">{t("xpGain", { amount })}</span>
      {hasMultiplier && (
        <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium">
          {t("streakMultiplier", { multiplier })}
        </span>
      )}
    </div>
  );
}
