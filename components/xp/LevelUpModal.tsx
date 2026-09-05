"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import { getLevelColorClass, getLevelBgClass, getLevelBorderClass } from "@/lib/xp-config";
import { Button } from "@/components/ui/Button";
import { Trophy, Sparkles } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  newLevel: number;
  title: string;
  color: string;
};

export function LevelUpModal({ open, onClose, newLevel, title, color }: Props) {
  const { t } = useTranslation("profile");
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Confetti */}
      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: "-20px",
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              <div
                className="h-3 w-3 rounded-sm"
                style={{
                  backgroundColor: [color, "#6366F1", "#22C55E", "#F59E0B", "#EF4444"][
                    Math.floor(Math.random() * 5)
                  ]
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div
          className={cn(
            "w-full max-w-sm rounded-2xl border bg-card p-6 text-center shadow-lg",
            getLevelBorderClass(color)
          )}
        >
          {/* Icon */}
          <div
            className={cn(
              "mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full",
              getLevelBgClass(color)
            )}
          >
            <Trophy className={cn("h-10 w-10", getLevelColorClass(color))} />
          </div>

          {/* Title */}
          <div className="mb-2 flex items-center justify-center gap-2">
            <Sparkles className={cn("h-5 w-5", getLevelColorClass(color))} />
            <h2 className="text-xl font-bold">{t("levelUp")}</h2>
            <Sparkles className={cn("h-5 w-5", getLevelColorClass(color))} />
          </div>

          {/* Level info */}
          <div className="mb-4">
            <div
              className={cn(
                "mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full border-4 text-2xl font-bold",
                getLevelBgClass(color),
                getLevelBorderClass(color),
                getLevelColorClass(color)
              )}
            >
              {newLevel}
            </div>
            <p className={cn("text-lg font-semibold", getLevelColorClass(color))}>
              {title}
            </p>
          </div>

          {/* Encouragement */}
          <p className="mb-6 text-sm text-muted">
            {t("levelUpEncouragement")}
          </p>

          {/* Close button */}
          <Button onClick={onClose} className="w-full">
            {t("common:continue")}
          </Button>
        </div>
      </div>
    </>
  );
}
