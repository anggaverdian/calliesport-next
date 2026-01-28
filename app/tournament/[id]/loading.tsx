import { Skeleton } from "@/components/ui/skeleton";

export default function TournamentDetailLoading() {
  return (
    <main className="min-w-[393px] w-auto min-h-screen bg-white flex flex-col">
      {/* AppBar skeleton */}
      <div className="sticky top-0 z-10 bg-white">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            {/* Back button */}
            <Skeleton className="w-6 h-6 rounded" />
            {/* Title area */}
            <div className="flex flex-col gap-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          {/* Menu dots */}
          <Skeleton className="w-6 h-6 rounded" />
        </div>

        {/* Tabs skeleton */}
        <div className="flex items-center justify-center gap-2 px-4 py-3 border-b border-neutral-100">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      </div>

      {/* Content skeleton - Round tab */}
      <div className="flex-1 p-4 space-y-4">
        {/* Round navigation */}
        <div className="flex items-center justify-between px-3">
          {/* Prev button */}
          <Skeleton className="w-10 h-10 rounded-lg" />
          {/* Round indicator */}
          <Skeleton className="h-10 w-28 rounded-full" />
          {/* Next button */}
          <Skeleton className="w-10 h-10 rounded-lg" />
        </div>

        {/* Score card skeleton */}
        <div className="flex flex-col gap-3 px-2 py-10">
          <div className="rounded-2xl border border-neutral-200 p-4 space-y-4">
            {/* Team A */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="w-14 h-12 rounded-lg" />
            </div>

            {/* VS divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-neutral-200" />
              <Skeleton className="h-5 w-8" />
              <div className="flex-1 h-px bg-neutral-200" />
            </div>

            {/* Team B */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="w-14 h-12 rounded-lg" />
            </div>
          </div>

          {/* Resting players */}
          <div className="flex items-center justify-center gap-2">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    </main>
  );
}
