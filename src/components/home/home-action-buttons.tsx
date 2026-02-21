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
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1">
        <span className="text-xs text-foreground/60">分享给好友</span>
        <ShareButton url={siteUrl} title="济和 DAO" text="欢迎来到高尔特峡谷——超级个体的交流协作平台" size="md" claimReward />
      </div>
      {standalone ? (
        <span className="text-xs text-foreground/50">已安装到桌面</span>
      ) : (
        <button
          type="button"
          onClick={() => {
            if (deferredPrompt) {
              deferredPrompt.prompt();
            } else {
              alert("请使用浏览器菜单「添加到主屏幕」或「安装应用」将济和 DAO 发送到桌面");
            }
          }}
          className="inline-flex items-center gap-2 rounded-full border border-foreground/30 px-4 py-2 text-xs font-medium text-foreground/80 transition hover:border-accent/50 hover:text-accent"
        >
          发送到桌面
        </button>
      )}
    </div>
  );
}
