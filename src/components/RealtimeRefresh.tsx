"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function RealtimeRefresh() {
  const router = useRouter();
  // Timestamp of last healthy signal (open or refresh event or heartbeat)
  const lastHealthy = useRef(0);

  useEffect(() => {
    let es: EventSource | null = null;

    function connect() {
      es?.close();
      es = new EventSource("/api/events");

      es.addEventListener("open", () => {
        lastHealthy.current = Date.now();
      });

      es.addEventListener("refresh", () => {
        lastHealthy.current = Date.now();
        router.refresh();
      });

      // Don't mark unhealthy on error — browser auto-reconnects SSE and
      // fires onerror on every reconnect attempt. We track health by
      // lastHealthy timestamp instead.
      es.onerror = () => {};
    }

    connect();

    // SSE server sends a heartbeat ping every 25s.
    // Only fall back to polling if we haven't heard anything for > 35s
    // (missed at least one heartbeat + grace period). Poll every 30s.
    const poll = setInterval(() => {
      if (Date.now() - lastHealthy.current > 35_000) {
        router.refresh();
      }
    }, 30_000);

    const onVisible = () => {
      if (!document.hidden) {
        connect();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      es?.close();
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  return null;
}
