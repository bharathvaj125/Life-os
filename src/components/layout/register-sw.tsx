"use client";

import { useEffect } from "react";

/** Registers the service worker in production so the app is installable. A failure is harmless and silent. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);
  return null;
}
