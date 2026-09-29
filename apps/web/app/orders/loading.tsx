// Orders list skeleton
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="skeleton h-9 w-40 rounded-2xl" />
        <div className="skeleton h-9 w-28 rounded-full" />
      </div>
      {/* Filter tabs */}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {[80, 96, 72, 88, 80, 72, 80].map((w, i) => (
          <div key={i} className="skeleton h-9 shrink-0 rounded-full" style={{ width: w, animationDelay: `${i * 40}ms` }} />
        ))}
      </div>
      {/* Order cards */}
      <div className="mt-6 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </div>
  );
}
