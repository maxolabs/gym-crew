"use client";

import { useEffect } from "react";

export function SetCurrentGroup({ groupId }: { groupId: string }) {
  useEffect(() => {
    window.localStorage.setItem("gymcrew:lastGroupId", groupId);
  }, [groupId]);
  return null;
}



