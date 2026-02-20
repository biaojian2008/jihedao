"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

type Props = {
  url: string;
  title: string;
  text?: string;
  className?: string;
  size?: "sm" | "md";
  /** 是否请求分享奖励（分享给好友每次 +10 济和币） */
  claimReward?: boolean;
};

export function ShareButton({ url, title, text, className = "", size = "sm", claimReward = false }: Props) {
  const [copied, setCopied] = useState(false);
  const [rewardMsg, setRewardMsg] = useState("");

  const onShareSuccess = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    if (claimReward) {
      fetch("/api/jihe-coin/share-reward", { method: "POST", credentials: "include" })
        .then((r) => r.json())
        .then((data) => {
          if (data?.ok && data?.amount) {
            setRewardMsg(`+${data.amount} 济和币`);
            setTimeout(() => setRewardMsg(""), 2500);
          }
        })
        .catch(() => {});
    }
  };

  const handleShare = async () => {
    const fullUrl = typeof window !== "undefined" ? new URL(url, window.location.origin).href : url;
    const shareText = text ? `${title}\n\n${text}` : title;
    const shareData = { title, text: shareText, url: fullUrl };

    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        onShareSuccess();
      } catch {
        copyLink(fullUrl, title, text);
      }
    } else {
      copyLink(fullUrl, title, text);
    }
  };

  const copyLink = (fullUrl: string, copyTitle?: string, copyText?: string) => {
    const toCopy = copyTitle && copyText
      ? `${copyTitle}\n\n${copyText}\n\n${fullUrl}`
      : copyTitle
        ? `${copyTitle}\n\n${fullUrl}`
        : fullUrl;
    navigator.clipboard.writeText(toCopy).then(() => {
      onShareSuccess();
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
      {copied && <span className="text-xs text-accent">{rewardMsg || "已复制"}</span>}
    </button>
  );
}
