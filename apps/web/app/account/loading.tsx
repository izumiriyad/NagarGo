// Account page skeleton
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <div className="skeleton h-10 w-48 rounded-2xl" />
      <div className="mt-2 skeleton h-5 w-64 rounded-xl" />
      {/* Tab row */}
      <div className="mt-6 flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-10 w-28 rounded-full" style={{ animationDelay: `${i * 50}ms` }} />
        ))}
      </div>
      {/* Content panel */}
      <div className="mt-6 space-y-4">
        <div className="skeleton h-48 rounded-2xl" />
        <div className="skeleton h-32 rounded-2xl" style={{ animationDelay: "80ms" }} />
        <div className="skeleton h-24 rounded-2xl" style={{ animationDelay: "160ms" }} />
      </div>
    </div>
  );
}
