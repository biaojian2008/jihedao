"use client";

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";
import { AdminGuard } from "@/components/admin/admin-guard";
import { ShareButton } from "@/components/share-button";

const SHARE_TEXT = "欢迎来到高尔特峡谷——超级个体的交流协作平台";
const SHARE_TITLE = "济和 DAO";

export default function SettingsPage() {
  const { t } = useLocale();
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<void> } | null>(null);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setStandalone(window.matchMedia("(display-mode: standalone)").matches || (window.navigator as { standalone?: boolean }).standalone === true);
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt({ prompt: () => e.prompt() });
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setDeferredPrompt(null);
    }
  };

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16">
      <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-xl font-semibold text-foreground">{t("settings.title")}</h1>

        {/* 分享与安装 */}
        <section className="mb-8 space-y-4">
          <h2 className="text-sm font-medium text-foreground/80">{t("settings.share")}</h2>
          <div className="flex flex-wrap items-center gap-3">
            {!standalone && deferredPrompt && (
              <button
                type="button"
                onClick={handleInstall}
                className="rounded-lg border border-accent/50 bg-accent/10 px-4 py-2 text-sm font-medium text-accent hover:bg-accent hover:text-black"
              >
                {t("settings.addToDesktop")}
              </button>
            )}
            {standalone && <span className="rounded-lg border border-foreground/20 px-4 py-2 text-sm text-foreground/60">已安装到桌面</span>}
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-192.png" alt="" className="h-10 w-10 rounded-lg object-contain" />
              <div className="flex flex-col gap-1">
                <span className="text-sm text-foreground/70">{t("settings.shareToFriend")}</span>
                <ShareButton url={siteUrl} title={SHARE_TITLE} text={SHARE_TEXT} size="md" />
              </div>
            </div>
          </div>
        </section>

        {/* 关于 */}
        <section className="mb-8 space-y-3">
          <h2 className="text-sm font-medium text-foreground/80">关于</h2>
          <p className="text-xs leading-relaxed text-foreground/70">
            济和 DAO 是协作 · 信用 · 社交 · 数据主权的去中心化实验场。欢迎来到高尔特峡谷，与超级个体一起交流协作。
          </p>
        </section>

        {/* 版本与链接 */}
        <section className="mb-8 space-y-3">
          <h2 className="text-sm font-medium text-foreground/80">更多</h2>
          <div className="flex flex-wrap gap-2">
            <a href="/community" className="text-xs text-foreground/60 hover:text-accent">社区动态</a>
            <a href="/intel" className="text-xs text-foreground/60 hover:text-accent">情报入口</a>
            <a href="/members" className="text-xs text-foreground/60 hover:text-accent">成员</a>
          </div>
          <p className="text-[10px] text-foreground/40">版本 0.1 · 更多设定敬请期待</p>
        </section>

        {/* 后台管理 - 置底，仅管理员可见 */}
        <section className="mt-8 border-t border-foreground/10 pt-6">
          <AdminGuard fallback={null}>
            <Link
              href="/admin"
              className="block rounded-xl border border-foreground/20 bg-foreground/[0.02] p-4 text-sm font-medium text-foreground/80 transition hover:border-accent/40 hover:text-accent"
            >
              {t("settings.adminPanel")} →
            </Link>
          </AdminGuard>
        </section>
      </main>
    </div>
  );
}
