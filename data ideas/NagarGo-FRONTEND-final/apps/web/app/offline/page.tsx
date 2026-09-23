export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper px-5 text-center">
      <h1 className="font-display text-2xl font-bold text-ink">You&rsquo;re offline</h1>
      <p className="max-w-sm text-ink/70">
        NagarGo needs a connection to show live orders and rider locations. Reconnect and try again.
      </p>
    </main>
  );
}
