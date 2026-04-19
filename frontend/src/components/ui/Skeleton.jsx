export function SkeletonCard() {
  return (
    <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 space-y-3">
          <div className="skeleton h-5 w-3/4 rounded-lg" />
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-2/3 rounded" />
          <div className="skeleton h-4 w-16 rounded-lg mt-2" />
        </div>
        <div className="skeleton w-16 h-16 rounded-xl shrink-0" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-neutral-800">
      <div className="skeleton h-4 w-24 rounded" />
      <div className="skeleton h-4 w-16 rounded" />
      <div className="skeleton h-4 flex-1 rounded" />
      <div className="skeleton h-4 w-12 rounded" />
      <div className="skeleton h-6 w-20 rounded-full" />
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
      <div className="flex justify-between mb-4">
        <div className="skeleton w-12 h-12 rounded-xl" />
        <div className="skeleton w-12 h-6 rounded" />
      </div>
      <div className="skeleton h-3 w-20 rounded mb-2" />
      <div className="skeleton h-8 w-28 rounded" />
    </div>
  );
}

export function SkeletonMenuGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
