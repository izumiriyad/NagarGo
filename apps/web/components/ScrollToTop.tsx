"use client";
import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Scroll-to-top on route change.
 * Placed in the root layout so every page transition
 * starts at the top of the page.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const lastPath = useRef<string>();

  useEffect(() => {
    if (pathname !== lastPath.current) {
      window.scrollTo({ top: 0, behavior: "instant" });
      lastPath.current = pathname;
    }
  }, [pathname]);

  return null;
}
