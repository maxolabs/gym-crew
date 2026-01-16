"use client";

import { useEffect } from "react";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md items-center px-3 py-10">
      <Card className="w-full space-y-3">
        <CardTitle>Something went wrong</CardTitle>
        <CardMeta>
          {error.message || "Unexpected error."}
        </CardMeta>
        <div className="flex gap-2">
          <Button size="lg" onClick={() => reset()}>
            Try again
          </Button>
          <Button size="lg" variant="secondary" href="/groups">
            Groups
          </Button>
        </div>
      </Card>
    </div>
  );
}



