import { cn } from "@/lib/utils";

export function NewsCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
      <div className="flex gap-4">
        <div className="h-20 w-20 shrink-0 rounded-lg bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-16 rounded bg-muted animate-pulse" />
          <div className="h-4 w-full rounded bg-muted animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function ArticleSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <div className="h-4 w-32 rounded bg-muted animate-pulse" />
      <div className="mt-4 h-8 w-full rounded bg-muted animate-pulse" />
      <div className="mt-2 h-8 w-2/3 rounded bg-muted animate-pulse" />
      <div className="mt-6 h-48 w-full rounded-xl bg-muted animate-pulse" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-4 w-full rounded bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function MarketAnalysisSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="h-5 w-40 rounded bg-muted animate-pulse" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 w-full rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function SearchSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 w-full rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
}
