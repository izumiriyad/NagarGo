"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Debounce a rapidly-changing value — useful for search inputs.
 * @param value    The raw value to debounce.
 * @param delay    Milliseconds to wait (default 300).
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebounced(value), delay);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [value, delay]);

  return debounced;
}
