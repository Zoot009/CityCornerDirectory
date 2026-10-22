"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

// Native share sheet where available (mostly mobile), otherwise copy the link.
export function ShareButton({ title, className }: { title: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => {}); // dismissing the sheet rejects; nothing to do
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" onClick={share} className={className}>
      {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
      <span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
    </button>
  );
}
