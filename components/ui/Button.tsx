import Link from "next/link";
import { cn } from "@/lib/cn";
import type React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "lg";
  href?: string;
};

const styles: Record<NonNullable<Props["variant"]>, string> = {
  primary:
    "bg-accent text-white hover:bg-accent/90 active:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed",
  secondary:
    "bg-card2 text-text border border-white/10 hover:bg-white/10 active:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-text hover:bg-white/5 active:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed",
  danger:
    "bg-danger text-white hover:bg-danger/90 active:bg-danger/80 disabled:opacity-50 disabled:cursor-not-allowed"
};

const sizes: Record<NonNullable<Props["size"]>, string> = {
  md: "h-11 px-4 text-sm",
  lg: "h-14 px-5 text-base"
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  href,
  ...props
}: Props) {
  const cls = cn(
    "inline-flex items-center justify-center rounded-xl font-semibold tracking-tight shadow-soft transition",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
    styles[variant],
    sizes[size],
    className
  );

  if (href) {
    return (
      <Link className={cls} href={href}>
        {props.children}
      </Link>
    );
  }

  return <button className={cls} {...props} />;
}


