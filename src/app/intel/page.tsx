"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/i18n/locale-context";

type FeedItem = { title: string; link: string; source: string; pubDate: string };
const MAX_PUSH = 10;

export default function IntelPage() {
  const { ready, authenticated, login } = useAuth();
  const { t } = useLocale();
  const [keywords, setKeywords] = useState("");
  const [maxPerPush, setMaxPerPush] = useState(5);
  const [saving, setSaving] = useState(false);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const r = await fetch("/api/intel/topics", { credentials: "include" });
      if (!r.ok) return;
      const data = (await r.json()) as { topic_name: string; keywords: string[]; max_per_push: number }[];
      const defaultRow = data?.find((x) => x.topic_name === "default");
      if (defaultRow) {
        setKeywords((defaultRow.keywords ?? []).join(", "));
        setMaxPerPush(Math.min(MAX_PUSH, defaultRow.max_per_push || 5));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const fetchFeed = useCallback(async () => {
    setLoadingFeed(true);
    setFeedError(null);
    try {
      const r = await fetch("/api/intel/feed?topic=default", { credentials: "include" });
      const data = await r.json();
      if (!r.ok) {
        setFeedError(typeof data?.error === "string" ? data.error : "Failed to fetch");
        setFeedItems([]);
        return;
      }
      setFeedItems(Array.isArray(data) ? data : []);
    } finally {
      setLoadingFeed(false);
    }
  }, []);

  useEffect(() => {
    if (ready && authenticated) fetchConfig();
  }, [ready, authenticated, fetchConfig]);

  useEffect(() => {
    if (ready && authenticated) fetchFeed();
  }, [ready, authenticated, fetchFeed]);

  const handleSave = async () => {
    const kwList = keywords
      .split(/[,，\s]+/)
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 10);
    setSaving(true);
    try {
      const r = await fetch("/api/intel/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ topic_name: "default", keywords: kwList, max_per_push: maxPerPush }),
      });
      if (!r.ok) {
        const e = await r.json();
        alert(e?.error ?? "保存失败");
        return;
      }
      await fetchFeed();
    } finally {
      setSaving(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen pt-14 pb-20 md:pb-16">
        <main className="mx-auto max-w-xl px-4 py-8 text-center sm:px-6">
          <p className="text-sm text-foreground/60">{t("intel.loading")}</p>
        </main>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen pt-14 pb-20 md:pb-16">
        <main className="mx-auto max-w-xl px-4 py-8 text-center sm:px-6">
          <h1 className="mb-2 text-xl font-semibold text-foreground">{t("intel.title")}</h1>
          <p className="text-sm text-foreground/70">{t("intel.needLogin")}</p>
          <button
            type="button"
            onClick={() => login()}
            className="mt-4 rounded-full border border-accent bg-accent px-6 py-3 text-sm font-semibold text-black hover:bg-accent/90"
          >
            Login
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16">
      <main className="mx-auto max-w-xl px-4 py-6 sm:px-6">
        <h1 className="mb-4 text-xl font-semibold text-foreground">{t("intel.title")}</h1>

        {/* 设置：关键词 + 推送条数 */}
        <div className="mb-6 rounded-xl border border-foreground/20 bg-foreground/[0.02] p-4">
          <h2 className="mb-3 text-sm font-medium text-foreground">{t("intel.settings")}</h2>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <label className="block text-xs text-foreground/70">{t("intel.keywords")}</label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder={t("intel.keywordsHint")}
                className="mt-1 w-full rounded border border-foreground/30 bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div className="w-24">
              <label className="block text-xs text-foreground/70">{t("intel.maxPerPush")}</label>
              <input
                type="number"
                min={1}
                max={MAX_PUSH}
                value={maxPerPush}
                onChange={(e) => setMaxPerPush(Math.min(MAX_PUSH, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                className="mt-1 w-full rounded border border-foreground/30 bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded border border-accent bg-accent/10 px-4 py-2 text-sm font-medium text-accent hover:bg-accent hover:text-black disabled:opacity-50"
            >
              {t("intel.save")}
            </button>
          </div>
        </div>

        {/* 推送列表 */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-medium text-foreground">{t("intel.feed")}</h2>
          <button
            type="button"
            onClick={fetchFeed}
            disabled={loadingFeed}
            className="rounded border border-accent/50 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 disabled:opacity-50"
          >
            {t("intel.refresh")}
          </button>
        </div>

        {loadingFeed ? (
          <p className="py-8 text-center text-sm text-foreground/60">{t("intel.loading")}</p>
        ) : feedError ? (
          <p className="py-8 text-center text-sm text-red-500">{feedError}</p>
        ) : feedItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground/60">{t("intel.empty")}</p>
        ) : (
          <ul className="space-y-3">
            {feedItems.map((item, i) => (
              <li key={i} className="rounded-lg border border-foreground/10 bg-foreground/[0.02] p-3">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-medium text-foreground hover:text-accent"
                >
                  {item.title}
                </a>
                <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-foreground/60">
                  <span>{item.source}</span>
                  <span>{item.pubDate}</span>
                </p>
              </li>
            ))}
          </ul>
        )}

        {/* AI Agent 预留 */}
        <div className="mt-8 rounded-xl border border-dashed border-foreground/20 bg-foreground/[0.02] p-6 text-center">
          <p className="text-xs uppercase tracking-wider text-accent/60">AI Agent</p>
          <p className="mt-2 text-sm text-foreground/50">即将上线 · Coming Soon</p>
        </div>

        {/* 友情链接：自由意志 / 自由至上 / Web3 / 超级个体 */}
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-medium text-foreground/80">{t("intel.friendLinks")}</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { name: "Mises Institute", url: "https://mises.org" },
              { name: "Vitalik.eth", url: "https://vitalik.eth.limo" },
              { name: "Bankless", url: "https://bankless.com" },
              { name: "Farcaster", url: "https://warpcast.com" },
              { name: "FEE", url: "https://fee.org" },
              { name: "Ayn Rand Institute", url: "https://aynrand.org" },
            ].map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="rounded border border-foreground/20 px-3 py-1.5 text-xs text-foreground/70 hover:border-accent/40 hover:text-accent">
                {l.name}
              </a>
            ))}
          </div>
        </div>

        {/* 书籍 */}
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-medium text-foreground/80">{t("intel.books")}</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { name: "主权个人", url: "https://en.wikipedia.org/wiki/The_Sovereign_Individual" },
              { name: "阿特拉斯耸耸肩", url: "https://zh.wikipedia.org/wiki/阿特拉斯耸耸肩" },
              { name: "源泉", url: "https://zh.wikipedia.org/wiki/源泉_(小说)" },
              { name: "人、经济与国家", url: "https://zh.wikipedia.org/wiki/人、经济与国家" },
              { name: "The Sovereign Individual", url: "https://www.amazon.com/dp/0684832720" },
              { name: "What Has Government Done", url: "https://mises.org/library/what-government-has-done-our-money" },
            ].map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="rounded border border-foreground/20 px-3 py-1.5 text-xs text-foreground/70 hover:border-accent/40 hover:text-accent">
                {l.name}
              </a>
            ))}
          </div>
        </div>

        {/* 开源社区 */}
        <div className="mt-6 mb-8">
          <h3 className="mb-3 text-sm font-medium text-foreground/80">{t("intel.opensource")}</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { name: "GitHub", url: "https://github.com" },
              { name: "开源中国", url: "https://www.oschina.net" },
              { name: "Arduino", url: "https://www.arduino.cc" },
              { name: "Raspberry Pi", url: "https://www.raspberrypi.org" },
              { name: "Apache", url: "https://www.apache.org" },
              { name: "CNCF", url: "https://www.cncf.io" },
            ].map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="rounded border border-foreground/20 px-3 py-1.5 text-xs text-foreground/70 hover:border-accent/40 hover:text-accent">
                {l.name}
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
