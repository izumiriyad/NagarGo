import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="mx-auto flex min-h-[72vh] max-w-2xl flex-col items-center justify-center px-5 py-20 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-route-green/10 text-4xl">
          📦
        </div>
        <h1 className="font-display text-4xl font-bold text-ink sm:text-5xl">
          Lost in transit
        </h1>
        <p className="mt-4 max-w-md text-lg text-ink/60">
          This page doesn&apos;t exist or has moved. Let&apos;s get you back on the right route.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-route-green px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-route-green-dark"
          >
            Go home
          </Link>
          <Link
            href="/book"
            className="rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink transition hover:border-ink/30"
          >
            Book a delivery
          </Link>
          <Link
            href="/orders"
            className="rounded-full px-6 py-3 text-sm font-semibold text-ink/60 transition hover:text-ink"
          >
            My orders →
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
