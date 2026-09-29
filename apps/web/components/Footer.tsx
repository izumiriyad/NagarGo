import Image from "next/image";
import { Wordmark } from "./Wordmark";

const year = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-ink text-white">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <Image src="/nagargo-mark.png" alt="" width={28} height={28} />
              <Wordmark size="sm" tone="light" />
            </div>
            <p className="mt-3 max-w-xs text-sm text-white/60">
              Rajshahi's trusted hyperlocal delivery network — ID-verified riders, live tracking, OTP-protected handoff.
            </p>
            {/* Social links */}
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://www.facebook.com/nagargo000"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="NagarGo on Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-[#1877F2]"
              >
                <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://wa.me/8801683772714"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="NagarGo on WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-[#25D366]"
              >
                <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                </svg>
              </a>
              <a
                href="https://t.me/nagargo"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="NagarGo on Telegram"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-[#229ED9]"
              >
                <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-semibold text-white/80">Services</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li><a href="/book" className="transition hover:text-white">NagarGo Delivery</a></li>
              <li><a href="/medicine" className="transition hover:text-white">Medicine Express</a></li>
              <li><a href="/rider/register" className="transition hover:text-white">Become a rider</a></li>
              <li><a href="/#pricing" className="transition hover:text-white">Pricing</a></li>
              <li><a href="/#faq" className="transition hover:text-white">FAQ</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-white/80">Support</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li><a href="/orders" className="transition hover:text-white">My orders</a></li>
              <li><a href="/account" className="transition hover:text-white">My account</a></li>
              <li><a href="/notifications" className="transition hover:text-white">Notifications</a></li>
              <li><a href="/contact" className="transition hover:text-white">Contact support</a></li>
              <li>
                <a
                  href="https://wa.me/8801683772714"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-white"
                >
                  WhatsApp: +88 01683-772714
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white/80">Legal</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li><a href="/legal#terms" className="transition hover:text-white">Terms of service</a></li>
              <li><a href="/legal#privacy" className="transition hover:text-white">Privacy policy</a></li>
              <li><a href="/legal#terms" className="transition hover:text-white">Prohibited items</a></li>
              <li><a href="/legal#terms" className="transition hover:text-white">Medicine delivery policy</a></li>
              <li><a href="/legal#terms" className="transition hover:text-white">Rider terms</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-sm text-white/40">
            © {year} NagarGo. All rights reserved.
          </p>
          <p className="text-xs text-white/30">
            Developed &amp; operated by Sourak Jain · Rajshahi, Bangladesh
          </p>
        </div>
      </div>
    </footer>
  );
}
