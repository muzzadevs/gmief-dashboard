import React from "react";

/** Single skeleton line/block. */
export function SkeletonLine({
  className = "h-4 w-full",
}: {
  className?: string;
}) {
  return <div className={`skeleton-pulse ${className}`} />;
}

/** Skeleton that mimics a glass card item (used for lists of zones, churches, etc.). */
export function SkeletonCard() {
  return (
    <div className="glass-card-solid px-5 py-4 flex items-center gap-4">
      <div className="skeleton-pulse w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton-pulse h-4 w-3/5" />
        <div className="skeleton-pulse h-3 w-2/5" />
      </div>
      <div className="skeleton-pulse h-9 w-20 rounded-lg flex-shrink-0" />
    </div>
  );
}

/** Skeleton list of N cards. */
export function SkeletonCardList({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** Skeleton that mimics a table with headers + rows. */
export function SkeletonTable({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="glass-card-solid overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 border-b border-slate-200 bg-slate-50/50">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton-pulse h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex gap-4 px-4 py-3 border-b border-slate-100"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="skeleton-pulse h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Skeleton for a 2-col grid of module cards (dashboard). */
export function SkeletonModuleGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card-solid p-0 overflow-hidden">
          <div className="skeleton-pulse h-1.5 w-full rounded-none" />
          <div className="p-5 sm:p-6 flex items-start gap-4">
            <div className="skeleton-pulse w-12 h-12 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton-pulse h-5 w-3/4" />
              <div className="skeleton-pulse h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
