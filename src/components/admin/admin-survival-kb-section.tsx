"use client";

import { useState, useEffect } from "react";

type PendingItem = {
  id: string;
  raw_input: string;
  input_type: string;
  ai_title: string;
  ai_summary: string;
  ai_tags: string[];
  relevance_score: number;
  created_at: string;
};

type KbItem = {
  id: string;
  title: string;
  tags: string[];
  source: string | null;
  created_at: string;
};

export function AdminSurvivalKbSection() {
  const [tab, setTab] = useState<"submit" | "review" | "library">("submit");
  const [submitInput, setSubmitInput] = useState("");
  const [inputType, setInputType] = useState<"text" | "url">("text");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [library, setLibrary] = useState<KbItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const fetchOpts = { credentials: "include" as const };

  async function loadPending() {
    setLoadingList(true);
    try {
      const res = await fetch("/api/canmou/survival/knowledge?type=pending", fetchOpts);
      const data = (await res.json()) as { items?: PendingItem[] };
      setPending(data.items ?? []);
    } finally {
      setLoadingList(false);
    }
  }

  async function loadLibrary() {
    setLoadingList(true);
    try {
      const res = await fetch("/api/canmou/survival/knowledge?type=approved", fetchOpts);
      const data = (await res.json()) as { items?: KbItem[] };
      setLibrary(data.items ?? []);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    if (tab === "review") loadPending();
    if (tab === "library") loadLibrary();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit() {
    if (!submitInput.trim()) return;
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const res = await fetch("/api/canmou/survival/knowledge", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: submitInput, inputType }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; processed?: { title: string; score: number; summary: string } };
      if (data.ok) {
        setSubmitResult(`✅ 已加入审核队列\n标题：${data.processed?.title}\n相关度：${data.processed?.score}/100\n摘要：${data.processed?.summary}`);
        setSubmitInput("");
      } else {
        setSubmitResult(`❌ 错误：${data.error}`);
      }
    } catch (e) {
      setSubmitResult(`❌ 网络错误：${(e as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReview(id: string, action: "approve" | "reject") {
    await fetch("/api/canmou/survival/knowledge", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    setPending((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleDelete(id: string) {
    if (!confirm("确认从知识库删除此条目？")) return;
    await fetch(`/api/canmou/survival/knowledge?id=${id}`, { method: "DELETE", credentials: "include" });
    setLibrary((prev) => prev.filter((k) => k.id !== id));
  }

  return (
    <section className="mt-10 border-t border-foreground/10 pt-8">
      <h2 className="text-lg font-semibold mb-1">🛡️ 生存手册知识库</h2>
      <p className="text-xs text-foreground/50 mb-4">录入、审核、管理屁民生存手册的知识库内容</p>

      {/* Tab 切换 */}
      <div className="flex gap-2 mb-6">
        {([["submit", "录入"], ["review", `审核 ${pending.length > 0 ? `(${pending.length})` : ""}`], ["library", "已入库"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition ${
              tab === key
                ? "border-foreground/40 bg-foreground/10 text-foreground"
                : "border-foreground/10 text-foreground/50 hover:border-foreground/20"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 录入 Tab */}
      {tab === "submit" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setInputType("text")}
              className={`px-3 py-1 text-xs rounded border transition ${inputType === "text" ? "border-accent bg-accent/10 text-accent" : "border-foreground/15 text-foreground/50"}`}
            >
              粘贴文本
            </button>
            <button
              onClick={() => setInputType("url")}
              className={`px-3 py-1 text-xs rounded border transition ${inputType === "url" ? "border-accent bg-accent/10 text-accent" : "border-foreground/15 text-foreground/50"}`}
            >
              网页 URL
            </button>
          </div>
          <textarea
            value={submitInput}
            onChange={(e) => setSubmitInput(e.target.value)}
            placeholder={inputType === "url" ? "粘贴网页 URL，AI 自动抓取正文" : "粘贴原始内容（话术、法条、实战经验等）"}
            rows={6}
            className="w-full bg-foreground/[0.02] border border-foreground/15 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-foreground/30 resize-none"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !submitInput.trim()}
            className="px-4 py-2 text-sm bg-foreground text-background rounded-lg disabled:opacity-40 hover:opacity-80 transition"
          >
            {submitting ? "AI 分析中…" : "提交审核"}
          </button>
          {submitResult && (
            <pre className="text-xs text-foreground/60 bg-foreground/[0.03] rounded-lg p-3 whitespace-pre-wrap">
              {submitResult}
            </pre>
          )}
        </div>
      )}

      {/* 审核 Tab */}
      {tab === "review" && (
        <div className="space-y-4">
          {loadingList && <p className="text-xs text-foreground/40">加载中…</p>}
          {!loadingList && pending.length === 0 && (
            <p className="text-xs text-foreground/40">暂无待审核内容</p>
          )}
          {pending.map((item) => (
            <div key={item.id} className="border border-foreground/10 rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.ai_title}</p>
                  <p className="text-[10px] text-foreground/40 mt-0.5">
                    {item.input_type === "url" ? `URL: ${item.raw_input.slice(0, 60)}` : "文本输入"} ·
                    {new Date(item.created_at).toLocaleDateString("zh-CN")}
                  </p>
                </div>
                <span
                  className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border ${
                    item.relevance_score >= 80
                      ? "border-green-500/40 text-green-400 bg-green-500/10"
                      : item.relevance_score >= 60
                      ? "border-yellow-500/40 text-yellow-400 bg-yellow-500/10"
                      : "border-red-500/40 text-red-400 bg-red-500/10"
                  }`}
                >
                  {item.relevance_score}分
                </span>
              </div>
              <p className="text-xs text-foreground/60 leading-relaxed">{item.ai_summary}</p>
              {item.ai_tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.ai_tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/5 text-foreground/50">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleReview(item.id, "approve")}
                  className="px-3 py-1 text-xs rounded-lg bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25 transition"
                >
                  ✅ 批准入库
                </button>
                <button
                  onClick={() => handleReview(item.id, "reject")}
                  className="px-3 py-1 text-xs rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition"
                >
                  ❌ 拒绝
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 已入库 Tab */}
      {tab === "library" && (
        <div className="space-y-2">
          {loadingList && <p className="text-xs text-foreground/40">加载中…</p>}
          {!loadingList && library.length === 0 && (
            <p className="text-xs text-foreground/40">知识库暂无内容</p>
          )}
          {library.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2 py-2.5 px-3 rounded-lg border border-foreground/8 hover:border-foreground/15 transition">
              <div className="min-w-0">
                <p className="text-sm text-foreground truncate">{item.title}</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {item.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="text-[10px] text-foreground/40">{tag}</span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="flex-shrink-0 text-xs text-red-400/60 hover:text-red-400 transition"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
