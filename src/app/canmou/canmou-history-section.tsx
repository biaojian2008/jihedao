"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getOrCreateCanmouClientToken } from "@/lib/canmou-client-token";

type HistoryItem = {
  id: string;
  domain: string;
  domainName: string;
  created_at: string;
  preview: string;
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function CanmouHistorySection() {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getOrCreateCanmouClientToken();
    if (!token) {
      setItems([]);
      return;
    }
    setError(null);
    try {
      const r = await fetch("/api/canmou/history", {
        headers: { "X-Canmou-Client": token },
      });
      const data = (await r.json()) as { items?: HistoryItem[]; error?: string };
      if (!r.ok) {
        setError(data.error ?? "加载失败");
        setItems([]);
        return;
      }
      setItems(data.items ?? []);
    } catch {
      setError("网络错误");
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [load]);

  if (items === null) {
    return (
      <section className="mb-6 rounded-xl border border-foreground/15 bg-foreground/[0.02] p-4">
        <h2 className="text-sm font-semibold text-foreground">历史咨询</h2>
        <p className="mt-2 text-xs text-foreground/50">加载中…</p>
      </section>
    );
  }

  return (
    <section className="mb-6 rounded-xl border border-foreground/15 bg-foreground/[0.02] p-4">
      <h2 className="text-sm font-semibold text-foreground">历史咨询</h2>
      <p className="mt-1 text-xs text-foreground/55">
        在本机浏览器生成的参谋建议会自动保存在此列表（换设备或清除数据后将不可见）。
      </p>
      {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}
      {items.length === 0 && !error ? (
        <p className="mt-3 text-xs text-foreground/50">暂无记录。完成任一参谋问卷并生成建议后，将出现在这里。</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((row) => (
            <li key={row.id}>
              <Link
                href={`/canmou/history/${row.id}`}
                className="block rounded-lg border border-foreground/10 bg-background/40 px-3 py-2.5 transition hover:border-accent/40 hover:bg-accent/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-accent">{row.domainName}</span>
                  <time className="shrink-0 text-[10px] text-foreground/45" dateTime={row.created_at}>
                    {formatTime(row.created_at)}
                  </time>
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-foreground/70">{row.preview}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
