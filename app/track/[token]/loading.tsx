import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Skeleton className="h-48 rounded-lg" />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
    </main>
  );
}
