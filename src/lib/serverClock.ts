"use client";
import { useEffect, useState } from "react";

/**
 * Game clocks are measured against timestamps the server wrote, so the browser
 * has to agree with the server about what time it is. A device whose clock is
 * a few seconds off would otherwise show the wrong time left, or report
 * timeouts early or late. We estimate the offset (NTP-style: assume the
 * server's reply was stamped halfway through the round trip) and apply it.
 */

const RESYNC_MS = 2 * 60 * 1000;
const RETRY_MS = 10 * 1000; // back off after a failed attempt

let offset = 0; // serverTime - deviceTime, in ms
let bestRtt = Infinity;
let lastSync = 0;
let retryAt = 0;
let inFlight: Promise<void> | null = null;

/** The server's current time in ms, as best we can tell. */
export const serverNow = () => Date.now() + offset;

/** Measure the offset. Cheap to call often: it only fetches when stale. */
export function syncServerClock(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (inFlight) return inFlight;
  if (Date.now() - lastSync < RESYNC_MS || Date.now() < retryAt)
    return Promise.resolve();
  const t0 = Date.now();
  inFlight = fetch("/api/time", { cache: "no-store" })
    .then((r) => r.json())
    .then(({ now }: { now: number }) => {
      const t1 = Date.now();
      const rtt = t1 - t0;
      // Keep the most precise sample (lowest latency) until it goes stale.
      if (rtt <= bestRtt * 1.5 || Date.now() - lastSync >= RESYNC_MS) {
        offset = now - (t0 + t1) / 2;
        bestRtt = rtt;
      }
      lastSync = Date.now();
    })
    .catch(() => {
      retryAt = Date.now() + RETRY_MS; // keep the previous offset
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/**
 * Server time, re-read every `tickMs`. Keep this in small leaf components (a
 * clock, a watcher) so the ticking re-renders only them, not a whole page.
 */
export function useServerNow(tickMs = 250) {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    let alive = true;
    const tick = () => alive && setNow(serverNow());
    syncServerClock().then(tick);
    const id = setInterval(() => {
      syncServerClock(); // no-op unless the last sample is stale
      tick();
    }, tickMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [tickMs]);
  return now;
}
