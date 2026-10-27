"use client";
import { useEffect } from "react";

/** Registers the offline service worker (production only, so dev reloads are never served stale). */
export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const had = !!navigator.serviceWorker.controller;
    // A new deployment replaces the worker and its caches; reload once so the page and its files match again.
    const swap = () => had && location.reload();
    navigator.serviceWorker.addEventListener("controllerchange", swap);
    navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => navigator.serviceWorker.removeEventListener("controllerchange", swap);
  }, []);
  return null;
}
