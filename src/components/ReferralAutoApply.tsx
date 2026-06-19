"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { applyReferralCodeByString } from "@/app/(creator)/actions";

export function ReferralAutoApply({ code }: { code: string }) {
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    applyReferralCodeByString(code).then(() => {
      // Strip ?ref= from URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete("ref");
      router.replace(url.pathname + (url.search || ""));
    });
  }, [code, router]);

  return null;
}
