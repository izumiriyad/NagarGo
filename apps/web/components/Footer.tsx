import Image from "next/image";
import { Wordmark } from "./Wordmark";

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-ink text-white">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <Image src="/nagargo-mark.png" alt="" width={28} height={28} />
              <Wordmark size="sm" tone="light" />
            </div>
            <p className="mt-3 max-w-xs text-sm text-white/60">
              A trusted hyperlocal delivery network connecting Rajshahi with verified local riders.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white/80">Services</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li><a href="/book" className="transition hover:text-white">NagarGo Delivery</a></li>
              <li><a href="/medicine" className="transition hover:text-white">Medicine Express</a></li>
              <li><a href="/rider/register" className="transition hover:text-white">Become a rider</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white/80">Support</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li><a href="/orders" className="transition hover:text-white">My orders</a></li>
              <li><a href="/account" className="transition hover:text-white">My account</a></li>
              <li><a href="mailto:support@nagargo.com" className="transition hover:text-white">Contact support</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white/80">Legal</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li><a href="/legal#terms" className="transition hover:text-white">Terms of service</a></li>
              <li><a href="/legal#privacy" className="transition hover:text-white">Privacy policy</a></li>
              <li><a href="/legal#terms" className="transition hover:text-white">Prohibited items policy</a></li>
              <li><a href="/legal#terms" className="transition hover:text-white">Medicine delivery policy</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center">
          <p className="text-sm font-bold text-white">
            All Copyrights of This Website are Reserved to Sourak Jain
          </p>
        </div>
      </div>
    </footer>
  );
}
