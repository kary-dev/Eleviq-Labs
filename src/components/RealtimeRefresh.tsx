"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function RealtimeRefresh() {
  const router = useRouter();

  useEffect(() => {
    const es = new EventSource("/api/events");
    es.addEventListener("refresh", () => router.refresh());
    return () => es.close();
  }, [router]);

  return null;
}
