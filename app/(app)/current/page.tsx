"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function CurrentGroupPage() {
  const router = useRouter();

  useEffect(() => {
    const last = window.localStorage.getItem("gymcrew:lastGroupId");
    if (last) router.replace(`/g/${last}`);
  }, [router]);

  return (
    <Card className="space-y-3">
      <CardTitle>No current group</CardTitle>
      <CardMeta>Open a group from “Groups” to set it as current.</CardMeta>
      <Button href="/groups" size="lg">
        Go to Groups
      </Button>
    </Card>
  );
}



