"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

type Props = {
  url: string;
  title: string;
  text?: string;
  className?: string;
  size?: "sm" | "md";
};

export function ShareButton({ url, title, text, className = "", size = "sm" }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const fullUrl = typeof window !== "undefined" ? new URL(url, window.location.origin).href : url;
    const shareData = { title, text: text ?? title, url: fullUrl };

    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        copyLink(fullUrl);
      }
    } else {
      copyLink(fullUrl);
    }
  };

  const copyLink = (fullUrl: string) => {
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center gap-1.5 rounded p-2 text-foreground/60 transition hover:bg-foreground/10 hover:text-accent ${className}`}
      title="分享"
      aria-label="分享"
    >
      <Share2 className={iconSize} />
      {copied && <span className="text-xs text-accent">已复制</span>}
    </button>
  );
}
