"use client";

import { Play } from "lucide-react";

export function YouTubeLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-7 items-center gap-1 rounded-lg bg-red-500/10 px-2 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
    >
      <Play className="h-3 w-3" />
      Video
    </a>
  );
}
