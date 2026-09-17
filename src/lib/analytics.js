// src/lib/analytics.js
export function track(eventName, data = {}) {
  if (typeof window === "undefined") return;
  if (typeof window.umami === "undefined") return;
  try {
    window.umami.track(eventName, data);
  } catch {
    /* ignore */
  }
}
