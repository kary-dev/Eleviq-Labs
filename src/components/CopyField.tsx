"use client";

import { useState } from "react";
import { CopyIcon, CheckIcon } from "@/components/icons";

export function CopyField({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="flex gap-2">
        <input readOnly value={value} className="input font-mono text-xs" onFocus={(e) => e.target.select()} />
        <button onClick={copy} className="btn-accent shrink-0">
          {copied ? <><CheckIcon className="h-4 w-4" /> Copied</> : <><CopyIcon className="h-4 w-4" /> Copy</>}
        </button>
      </div>
    </div>
  );
}
