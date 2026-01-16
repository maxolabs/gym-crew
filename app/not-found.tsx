import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md items-center px-3 py-10">
      <Card className="w-full space-y-3">
        <CardTitle>Not found</CardTitle>
        <CardMeta>This page doesn’t exist (or you don’t have access).</CardMeta>
        <Button href="/groups" size="lg">
          Go to Groups
        </Button>
      </Card>
    </div>
  );
}



