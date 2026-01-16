import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";

export default function Loading() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-7 w-48" />
      <Card className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </Card>
      <Card className="space-y-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-40 w-full" />
      </Card>
    </div>
  );
}



