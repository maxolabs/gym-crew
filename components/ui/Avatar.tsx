import { cn } from "@/lib/cn";
import { User } from "lucide-react";

type Props = {
  src?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg";
  showTrainerBadge?: boolean;
  className?: string;
};

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base"
};

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7"
};

function getInitials(name?: string): string {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Avatar({
  src,
  name,
  size = "md",
  showTrainerBadge,
  className
}: Props) {
  const initials = getInitials(name);

  return (
    <div className={cn("relative inline-block", className)}>
      {src ? (
        <img
          src={src}
          alt={name || "Avatar"}
          className={cn(
            "rounded-full object-cover",
            sizes[size]
          )}
        />
      ) : (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-card2 font-semibold text-muted",
            sizes[size]
          )}
        >
          {initials || <User className={iconSizes[size]} />}
        </div>
      )}
      {showTrainerBadge && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
          T
        </span>
      )}
    </div>
  );
}
