"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function RealtimeRefresh() {
  const router = useRouter();
  const healthy = useRef(false);

  useEffect(() => {
    let es: EventSource | null = null;

    function connect() {
      es?.close();
      es = new EventSource("/api/events");

      es.addEventListener("open", () => { healthy.current = true; });
      es.addEventListener("refresh", () => { healthy.current = true; router.refresh(); });
      es.onerror = () => { healthy.current = false; };
    }

    connect();

    // Fallback poll every 10s when SSE is unhealthy (nginx/proxy killed the connection)
    const poll = setInterval(() => {
      if (!healthy.current) router.refresh();
    }, 10_000);

    // Reconnect immediately when tab regains focus
    const onVisible = () => { if (!document.hidden) connect(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      es?.close();
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  return null;
}
