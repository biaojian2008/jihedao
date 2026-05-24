"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentProfileId } from "@/lib/current-user";
import { useAuth } from "@/lib/auth-context";

export function ProjectCreateForm() {
  const router = useRouter();
  const { authenticated } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rulesText, setRulesText] = useState("");
  const [initialInvestment, setInitialInvestment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!getCurrentProfileId()) {
      setError("请先登录");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          rules_text: rulesText,
          initial_investment: Number(initialInvestment) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "创建失败");
        return;
      }
      router.push(`/projects/${data.id}`);
    } catch {
      setError("网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16">
      <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
        <Link href="/projects" className="text-xs text-accent/80 hover:text-accent">
          ← 返回项目列表
        </Link>
        <h1 className="mt-4 text-xl font-semibold text-accent">发起项目</h1>
        <p className="mt-1 text-xs text-foreground/60">
          项目内使用独立济和币账本。投资金额手动录入，1 人民币 = 1 投资济和币。
        </p>

        {!authenticated && (
          <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            请先登录后再发起项目
          </p>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs text-foreground/60">项目名称 *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-foreground/20 bg-black/40 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-foreground/60">项目介绍 *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full resize-none rounded-lg border border-foreground/20 bg-black/40 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-foreground/60">项目规则</label>
            <textarea
              value={rulesText}
              onChange={(e) => setRulesText(e.target.value)}
              rows={4}
              placeholder="股东共同商定的协作规则…"
              className="w-full resize-none rounded-lg border border-foreground/20 bg-black/40 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-foreground/60">发起人初始投资（元，可选）</label>
            <input
              type="number"
              min="0"
              step="1"
              value={initialInvestment}
              onChange={(e) => setInitialInvestment(e.target.value)}
              className="w-full rounded-lg border border-foreground/20 bg-black/40 px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="button"
            disabled={submitting || !authenticated}
            onClick={submit}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-black disabled:opacity-50"
          >
            {submitting ? "创建中…" : "创建项目"}
          </button>
        </div>
      </main>
    </div>
  );
}
