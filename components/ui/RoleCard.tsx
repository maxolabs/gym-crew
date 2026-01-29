"use client";

import { cn } from "@/lib/cn";
import type React from "react";

type Props = {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
};

export function RoleCard({
  selected,
  onSelect,
  icon,
  title,
  description,
  disabled
}: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "w-full rounded-2xl border-2 p-5 text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
        selected
          ? "border-accent bg-accent/10"
          : "border-white/10 bg-card hover:border-white/20 hover:bg-card2",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            selected ? "bg-accent text-white" : "bg-card2 text-muted"
          )}
        >
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-text">{title}</h3>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
        <div
          className={cn(
            "mt-1 h-5 w-5 shrink-0 rounded-full border-2 transition-colors",
            selected ? "border-accent bg-accent" : "border-white/20 bg-transparent"
          )}
        >
          {selected && (
            <svg
              className="h-full w-full text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}
