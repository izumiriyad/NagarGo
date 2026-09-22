export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16 space-y-5">
      <div className="skeleton h-10 w-64 rounded-2xl" />
      <div className="skeleton h-5 w-96 rounded-xl" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton h-32 rounded-2xl" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    </div>
  );
}
