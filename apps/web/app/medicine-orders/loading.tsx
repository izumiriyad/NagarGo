// Medicine order list skeleton
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <div className="flex items-center justify-between">
        <div className="skeleton h-9 w-52 rounded-2xl" />
        <div className="skeleton h-10 w-28 rounded-full" />
      </div>
      <div className="mt-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-24 rounded-2xl" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </div>
  );
}
