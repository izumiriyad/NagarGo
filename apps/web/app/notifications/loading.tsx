// Notifications list skeleton
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <div className="skeleton h-9 w-48 rounded-2xl" />
      <div className="mt-2 skeleton h-5 w-56 rounded-xl" />
      <div className="mt-6 space-y-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton h-20 rounded-2xl" style={{ animationDelay: `${i * 50}ms` }} />
        ))}
      </div>
    </div>
  );
}
