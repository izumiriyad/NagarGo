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
              <li>NagarGo Delivery</li>
              <li>Medicine Express</li>
              <li>Become a rider</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white/80">Support</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li>Help center</li>
              <li>Safety</li>
              <li>Contact support</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white/80">Legal</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li>Terms of service</li>
              <li>Privacy policy</li>
              <li>Prohibited items policy</li>
              <li>Medicine delivery policy</li>
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
