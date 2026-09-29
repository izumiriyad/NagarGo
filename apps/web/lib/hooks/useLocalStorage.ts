"use client";
import { useState, useEffect, useCallback } from "react";

/**
 * A useState-like hook that persists the value in localStorage.
 * SSR-safe: falls back to initialValue on the server.
 *
 * @param key          The localStorage key.
 * @param initialValue Default value if the key doesn't exist yet.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = typeof value === "function" ? (value as (p: T) => T)(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // Ignore write errors (storage full, private mode, etc.)
        }
        return next;
      });
    },
    [key]
  );

  // Sync across tabs
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== key) return;
      try {
        setStoredValue(e.newValue ? JSON.parse(e.newValue) : initialValue);
      } catch {
        // ignore
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key, initialValue]);

  return [storedValue, setValue];
}
