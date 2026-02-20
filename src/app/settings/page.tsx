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

export default function SettingsPage() {
  const { t, locale, setLocale } = useLocale();
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

        <section className="mb-8 space-y-4">
          <h2 className="text-sm font-medium text-foreground/80">{t("settings.language")}</h2>
          <div className="flex gap-2">
            {(["zh", "en", "ja"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLocale(l)}
                className={`rounded-lg border px-4 py-2 text-sm ${
                  locale === l ? "border-accent bg-accent/10 text-accent" : "border-foreground/20 text-foreground/70 hover:border-accent/40"
                }`}
              >
                {l === "zh" ? "中文" : l === "en" ? "English" : "日本語"}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8 space-y-4">
          <h2 className="text-sm font-medium text-foreground/80">{t("settings.share")}</h2>
          <div className="flex flex-wrap gap-3">
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
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground/70">{t("settings.shareToFriend")}</span>
              <ShareButton url={siteUrl} title="济和 DAO" text="协作 · 信用 · 社交 · 数据主权的去中心化实验场" size="md" />
            </div>
          </div>
        </section>

        <section className="mb-8">
          <AdminGuard fallback={null}>
            <Link
              href="/admin"
              className="block rounded-xl border border-foreground/20 bg-foreground/[0.02] p-4 text-sm font-medium text-foreground/80 transition hover:border-accent/40 hover:text-accent"
            >
              {t("settings.adminPanel")} →
            </Link>
          </AdminGuard>
        </section>

        <p className="text-xs text-foreground/40">{t("settings.hint")}</p>
      </main>
    </div>
  );
}
