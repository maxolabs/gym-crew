import { cn } from "@/lib/cn";
import type React from "react";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-white/10 bg-card2 px-3 text-sm text-text",
        "placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/60",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[96px] w-full rounded-xl border border-white/10 bg-card2 px-3 py-2 text-sm text-text",
        "placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/60",
        className
      )}
      {...props}
    />
  );
}


