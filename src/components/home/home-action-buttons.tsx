"use client";

import { useState, useEffect } from "react";
import { ShareButton } from "@/components/share-button";

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

export function HomeActionButtons() {
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<void> } | null>(null);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as { standalone?: boolean }).standalone === true
    );
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt({ prompt: () => e.prompt() });
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const canInstall = !standalone && deferredPrompt;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {canInstall && (
        <button
          type="button"
          onClick={() => deferredPrompt?.prompt()}
          className="inline-flex items-center gap-2 rounded-full border border-foreground/30 px-4 py-2 text-xs font-medium text-foreground/80 transition hover:border-accent/50 hover:text-accent"
        >
          添加到桌面
        </button>
      )}
      <div className="flex items-center gap-1">
        <span className="text-xs text-foreground/60">分享给好友</span>
        <ShareButton url={siteUrl} title="济和 DAO" text="协作 · 信用 · 社交 · 数据主权的去中心化实验场" size="md" />
      </div>
    </div>
  );
}
