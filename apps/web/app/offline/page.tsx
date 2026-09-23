"use client";

export default function OfflinePage() {
  return (
    <html lang="en">
      <body className="m-0 bg-[#F6F7F5] font-sans text-[#0B1220] antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center px-5 py-16 text-center">
          {/* Animated icon */}
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-lg shadow-black/5">
            <span className="text-4xl">📡</span>
          </div>

          <h1 className="font-display text-3xl font-bold text-[#0B1220] sm:text-4xl">
            You&apos;re offline
          </h1>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-[#0B1220]/60">
            NagarGo needs an internet connection to show live orders, pricing, and maps. Please check your
            connection and try again.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-[#0B1220] px-8 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#1a2a3a]"
            >
              Try again
            </button>
            <a
              href="/"
              className="text-sm font-medium text-[#2c7a3a] underline underline-offset-2 transition hover:text-[#1e5c2b]"
            >
              ← Go home
            </a>
          </div>

          <p className="mt-16 text-xs text-[#0B1220]/30">NagarGo · Rajshahi&apos;s local delivery network</p>
        </div>
      </body>
    </html>
  );
}
