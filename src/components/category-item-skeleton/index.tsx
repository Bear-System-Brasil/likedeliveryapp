import { Skeleton } from "../ui/skeleton";

export function CategoryItemSkeleton() {
  const width = `${60 + Math.random() * 100}%`;

  return (
    <div className="flex flex-col items-center justify-center gap-4 border-none">
      <Skeleton className="h-16 w-16" />

      <Skeleton style={{ width }} className="h-4" />
    </div>
  );
}
