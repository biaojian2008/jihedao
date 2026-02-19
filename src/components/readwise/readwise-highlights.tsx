"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen, Quote, Loader2, AlertCircle } from "lucide-react";

type Highlight = {
  id: string;
  text: string;
  title: string | null;
  author: string | null;
  highlighted_at: string | null;
  note: string | null;
};

type Props = { userId: string };

function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric", year: "numeric" });
}

export function ReadwiseHighlights({ userId }: Props) {
  const { data: highlights = [], isLoading, error } = useQuery({
    queryKey: ["readwise-highlights", userId],
    queryFn: async () => {
      const res = await fetch(`/api/readwise/highlights?userId=${userId}`, { credentials: "include" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error || (d as { hint?: string }).hint || `HTTP ${res.status}`);
      }
      return res.json() as Promise<Highlight[]>;
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="mt-6 rounded-xl border border-foreground/10 bg-black/40 p-6">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent/80">
          <BookOpen className="h-4 w-4" />
          阅读标注
        </h2>
        <div className="mt-4 flex items-center gap-2 text-sm text-foreground/60">
          <Loader2 className="h-4 w-4 animate-spin" />
          加载中…
        </div>
      </div>
    );
  }

  if (error) {
    const msg = error instanceof Error ? error.message : "加载失败";
    return (
      <div className="mt-6 rounded-xl border border-foreground/10 bg-black/40 p-6">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent/80">
          <BookOpen className="h-4 w-4" />
          阅读标注
        </h2>
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-400/90">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {msg}
        </div>
      </div>
    );
  }

  if (highlights.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-foreground/10 bg-black/40 p-6">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent/80">
          <BookOpen className="h-4 w-4" />
          阅读标注
        </h2>
        <p className="mt-4 text-sm text-foreground/50">暂无标注。网站未配置或可绑定个人 Token 以个性化</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent/80">
        <BookOpen className="h-4 w-4" />
        阅读标注 · 最近 {highlights.length} 条
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {highlights.map((h) => (
          <div
            key={h.id}
            className="rounded-xl border border-foreground/10 bg-black/40 p-4 transition hover:border-accent/30"
          >
            <div className="flex gap-2">
              <Quote className="mt-0.5 h-4 w-4 shrink-0 text-accent/60" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground/90 leading-relaxed">{h.text}</p>
                {(h.title || h.author) && (
                  <p className="mt-2 text-[11px] text-foreground/50">
                    {[h.title, h.author].filter(Boolean).join(" · ")}
                    {h.highlighted_at && ` · ${formatDate(h.highlighted_at)}`}
                  </p>
                )}
                {h.note && (
                  <p className="mt-1 text-xs text-foreground/60 italic">批注：{h.note}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
