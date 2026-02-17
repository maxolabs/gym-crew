"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type React from "react";
import type { AchievementRarity } from "@/lib/achievements/types";
import {
  Flame,
  Crown,
  Target,
  Medal,
  Trophy,
  Sunrise,
  Moon,
  Calendar,
  CheckCircle,
  Star,
  Footprints,
  Users,
  Zap,
  Sparkles,
  type LucideIcon
} from "lucide-react";
import { getLevelColorClass, getLevelBgClass, getLevelBorderClass } from "@/lib/xp-config";

const iconMap: Record<string, LucideIcon> = {
  Flame, Crown, Target, Medal, Trophy, Sunrise, Moon, Calendar, CheckCircle, Star, Footprints, Users
};

type AchievementToast = {
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  xp: number;
};

type XPGainToast = {
  amount: number;
  multiplier?: number;
};

type LevelUpToast = {
  newLevel: number;
  title: string;
  color: string;
};

type ToastItem = {
  id: string;
  type: "success" | "error" | "info" | "achievement" | "xp" | "levelup";
  message?: string;
  achievement?: AchievementToast;
  xpGain?: XPGainToast;
  levelUp?: LevelUpToast;
};

type ToastCtx = {
  push: (t: Omit<ToastItem, "id">) => void;
  pushAchievement: (a: AchievementToast) => void;
  pushXPGain: (x: XPGainToast) => void;
  pushLevelUp: (l: LevelUpToast) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

export function useToast() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToast must be used within <ToastProvider />");
  return v;
}

const rarityBorderStyles: Record<AchievementRarity, string> = {
  COMMON: "border-muted/30",
  RARE: "border-blue-500/50",
  EPIC: "border-purple-500/50",
  LEGENDARY: "border-amber-500/50"
};

const rarityIconStyles: Record<AchievementRarity, string> = {
  COMMON: "bg-muted/10 text-muted",
  RARE: "bg-blue-500/10 text-blue-400",
  EPIC: "bg-purple-500/10 text-purple-400",
  LEGENDARY: "bg-amber-500/10 text-amber-400"
};

const rarityXPStyles: Record<AchievementRarity, string> = {
  COMMON: "bg-muted/10 text-muted",
  RARE: "bg-blue-500/10 text-blue-400",
  EPIC: "bg-purple-500/10 text-purple-400",
  LEGENDARY: "bg-amber-500/10 text-amber-400"
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [confetti, setConfetti] = useState<string[]>([]);

  const push = useCallback((t: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setItems((p) => [...p, { id, ...t }]);
    const duration = t.type === "achievement" ? 5000 : 3200;
    window.setTimeout(() => {
      setItems((p) => p.filter((x) => x.id !== id));
    }, duration);
  }, []);

  const pushAchievement = useCallback((a: AchievementToast) => {
    const id = crypto.randomUUID();
    setItems((p) => [...p, { id, type: "achievement", achievement: a }]);

    // Trigger confetti for RARE+
    if (a.rarity !== "COMMON") {
      const confettiId = crypto.randomUUID();
      setConfetti((p) => [...p, confettiId]);
      window.setTimeout(() => {
        setConfetti((p) => p.filter((c) => c !== confettiId));
      }, 3000);
    }

    window.setTimeout(() => {
      setItems((p) => p.filter((x) => x.id !== id));
    }, 5000);
  }, []);

  const pushXPGain = useCallback((x: XPGainToast) => {
    const id = crypto.randomUUID();
    setItems((p) => [...p, { id, type: "xp", xpGain: x }]);
    window.setTimeout(() => {
      setItems((p) => p.filter((i) => i.id !== id));
    }, 2500);
  }, []);

  const pushLevelUp = useCallback((l: LevelUpToast) => {
    const id = crypto.randomUUID();
    setItems((p) => [...p, { id, type: "levelup", levelUp: l }]);

    // Trigger confetti for level up
    const confettiId = crypto.randomUUID();
    setConfetti((p) => [...p, confettiId]);
    window.setTimeout(() => {
      setConfetti((p) => p.filter((c) => c !== confettiId));
    }, 3000);

    // Level up toasts stay longer
    window.setTimeout(() => {
      setItems((p) => p.filter((i) => i.id !== id));
    }, 6000);
  }, []);

  const value = useMemo(() => ({ push, pushAchievement, pushXPGain, pushLevelUp }), [push, pushAchievement, pushXPGain, pushLevelUp]);

  return (
    <Ctx.Provider value={value}>
      {children}

      {/* Confetti */}
      {confetti.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={`${confetti[0]}-${i}`}
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
                  backgroundColor: ["#6366F1", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6"][
                    Math.floor(Math.random() * 5)
                  ]
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="fixed left-0 right-0 top-3 z-50 flex items-center justify-center px-3">
        <div className="flex w-full max-w-sm flex-col gap-2">
          {items.map((t) => {
            if (t.type === "achievement" && t.achievement) {
              const a = t.achievement;
              const Icon = iconMap[a.icon] ?? Target;
              const isLegendary = a.rarity === "LEGENDARY";

              return (
                <div
                  key={t.id}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border bg-card px-4 py-3 shadow-soft",
                    rarityBorderStyles[a.rarity]
                  )}
                  role="status"
                >
                  {/* Shimmer for legendary */}
                  {isLegendary && (
                    <div
                      className="pointer-events-none absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-amber-500/10 to-transparent"
                      style={{ backgroundSize: "200% 100%" }}
                    />
                  )}

                  <div className="relative flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        rarityIconStyles[a.rarity]
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">Achievement Unlocked!</p>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                            rarityXPStyles[a.rarity]
                          )}
                        >
                          +{a.xp} XP
                        </span>
                      </div>
                      <p className="text-xs text-muted">{a.name}</p>
                    </div>
                  </div>
                </div>
              );
            }

            // XP Gain Toast
            if (t.type === "xp" && t.xpGain) {
              const x = t.xpGain;
              const hasMultiplier = x.multiplier && x.multiplier > 1;

              return (
                <div
                  key={t.id}
                  className="flex items-center justify-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-accent shadow-lg animate-in slide-in-from-top-2"
                  role="status"
                >
                  <Zap className="h-4 w-4" />
                  <span className="font-bold">+{x.amount} XP</span>
                  {hasMultiplier && (
                    <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium">
                      {x.multiplier}x streak!
                    </span>
                  )}
                </div>
              );
            }

            // Level Up Toast
            if (t.type === "levelup" && t.levelUp) {
              const l = t.levelUp;

              return (
                <div
                  key={t.id}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border bg-card px-4 py-4 shadow-lg animate-in slide-in-from-top-2",
                    getLevelBorderClass(l.color)
                  )}
                  role="status"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2",
                        getLevelBgClass(l.color),
                        getLevelBorderClass(l.color)
                      )}
                    >
                      <span className={cn("text-xl font-bold", getLevelColorClass(l.color))}>
                        {l.newLevel}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className={cn("h-4 w-4", getLevelColorClass(l.color))} />
                        <p className="text-sm font-bold">Level Up!</p>
                        <Sparkles className={cn("h-4 w-4", getLevelColorClass(l.color))} />
                      </div>
                      <p className={cn("text-lg font-semibold", getLevelColorClass(l.color))}>
                        {l.title}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={t.id}
                className={cn(
                  "rounded-2xl border border-white/10 bg-card px-4 py-3 shadow-soft",
                  t.type === "success" && "border-accent/30",
                  t.type === "error" && "border-danger/30"
                )}
                role="status"
              >
                <p className="text-sm">{t.message}</p>
              </div>
            );
          })}
        </div>
      </div>
    </Ctx.Provider>
  );
}


