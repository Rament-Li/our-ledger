"use client";

import { useEffect } from "react";
import { shouldLockLedger } from "../lib/foreground-lock.mjs";

export function LedgerForegroundLock() {
  useEffect(() => {
    let locked = false;
    const lock = (event: "visibilitychange" | "pagehide") => {
      if (locked || !shouldLockLedger(event, document.visibilityState)) return;
      locked = true;
      void fetch("/api/lock", { method: "POST", keepalive: true, cache: "no-store" });
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") lock("visibilitychange");
      if (document.visibilityState === "visible" && locked) window.location.reload();
    };
    const onPageHide = () => lock("pagehide");
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);
  return null;
}
