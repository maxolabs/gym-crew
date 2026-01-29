"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Clock, AlertTriangle } from "lucide-react";

type Props = {
  deadline: string;
  className?: string;
};

function getTimeRemaining(deadline: string): {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  text: string;
} {
  const now = new Date();
  const end = new Date(deadline);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, text: "Expired" };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let text: string;
  if (days > 0) {
    text = `${days}d ${hours}h left`;
  } else if (hours > 0) {
    text = `${hours}h ${minutes}m left`;
  } else {
    text = `${minutes}m left`;
  }

  return { expired: false, days, hours, minutes, text };
}

export function CountdownBadge({ deadline, className }: Props) {
  const [remaining, setRemaining] = useState(() => getTimeRemaining(deadline));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(getTimeRemaining(deadline));
    }, 60000);

    return () => clearInterval(interval);
  }, [deadline]);

  const isUrgent = !remaining.expired && remaining.days === 0 && remaining.hours < 24;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        remaining.expired
          ? "bg-danger/10 text-danger"
          : isUrgent
            ? "bg-warning/10 text-warning"
            : "bg-accent/10 text-accent",
        className
      )}
    >
      {remaining.expired ? (
        <AlertTriangle className="h-3 w-3" />
      ) : (
        <Clock className="h-3 w-3" />
      )}
      {remaining.text}
    </span>
  );
}
