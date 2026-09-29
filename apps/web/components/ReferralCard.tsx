"use client";
import { useState } from "react";

interface Props {
  code: string;
  className?: string;
}

/**
 * Referral code share card.
 * - Copies code to clipboard on tap.
 * - Opens native share sheet if Web Share API is available (mobile).
 * - WhatsApp + direct share buttons as fallback.
 */
export function ReferralCard({ code, className = "" }: Props) {
  const [copied, setCopied] = useState(false);

  const shareText = `Use my NagarGo referral code ${code} to get a discount on your first delivery! 🛵 https://nagargo.com`;

  async function copy() {
    await navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "NagarGo referral", text: shareText, url: "https://nagargo.com" });
        return;
      } catch {
        // User cancelled — fall through to copy
      }
    }
    copy();
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className={`rounded-2xl border border-route-green/20 bg-gradient-to-br from-route-green/5 to-white p-5 ${className}`}>
      <p className="text-xs font-bold uppercase tracking-widest text-route-green-dark">Your referral code</p>

      {/* Code display */}
      <button
        type="button"
        id="referral-copy-btn"
        onClick={copy}
        className="mt-3 flex w-full items-center justify-between rounded-xl border-2 border-dashed border-route-green/30 bg-white px-5 py-4 transition hover:border-route-green/60 hover:bg-route-green/5"
        title="Click to copy"
        aria-label="Copy referral code"
      >
        <span className="font-mono text-2xl font-bold tracking-widest text-ink">{code}</span>
        <span className={`text-sm font-semibold transition ${copied ? "text-route-green-dark" : "text-ink/40"}`}>
          {copied ? "✓ Copied!" : "Copy"}
        </span>
      </button>

      <p className="mt-3 text-xs text-ink/50">Each friend who books their first delivery earns you a reward.</p>

      {/* Share buttons */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={share}
          className="flex-1 rounded-xl bg-route-green py-2.5 text-sm font-semibold text-white transition hover:bg-route-green-dark"
        >
          Share
        </button>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-[#25D366]/30 px-4 py-2.5 text-sm font-semibold text-[#128C7E] transition hover:bg-[#25D366]/10"
        >
          {/* WhatsApp icon */}
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.51 5.84L0 24l6.322-1.489A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.879 0-3.63-.518-5.13-1.418L2 22l1.446-4.769A9.957 9.957 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
          WhatsApp
        </a>
      </div>
    </div>
  );
}
