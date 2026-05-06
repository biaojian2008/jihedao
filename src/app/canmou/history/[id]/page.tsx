"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getOrCreateCanmouClientToken } from "@/lib/canmou-client-token";
import { isCanmouDomain, questionnaires } from "@/lib/questionnaires";

const DISCLAIMER =
  "以上内容由AI生成，仅供参考，不构成法律、财务、税务或医疗建议。重要决策请咨询持牌专业人士。";

type Detail = {
  id: string;
  domain: string;
  domainName: string;
  created_at: string;
  result: string;
  answers: Record<string, string> | null;
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

export default function CanmouHistoryDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [data, setData] = useState<Detail | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setData(null);
      return;
    }
    const token = getOrCreateCanmouClientToken();
    if (!token) {
      setError("无法读取本机标识，请关闭隐私模式后重试");
      setData(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        const r = await fetch(`/api/canmou/history/${id}`, {
          headers: { "X-Canmou-Client": token },
        });
        const json = (await r.json()) as Detail & { error?: string };
        if (cancelled) return;
        if (!r.ok) {
          setError(json.error ?? "加载失败");
          setData(null);
          return;
        }
        setData(json as Detail);
      } catch {
        if (!cancelled) {
          setError("网络错误");
          setData(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (data === undefined) {
    return (
      <div className="min-h-screen pt-14 pb-20 md:pb-16">
        <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
          <p className="text-sm text-foreground/60">加载中…</p>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen pt-14 pb-20 md:pb-16">
        <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
          <Link href="/canmou" className="text-xs text-accent hover:underline">
            ← 返回参谋首页
          </Link>
          <p className="mt-6 text-sm text-foreground/70">{error ?? "未找到该记录"}</p>
        </main>
      </div>
    );
  }

  const answerMap =
    data.answers && typeof data.answers === "object" && !Array.isArray(data.answers)
      ? (data.answers as Record<string, string>)
      : null;
  const qDef = isCanmouDomain(data.domain) ? questionnaires[data.domain] : null;
  const entries = answerMap
    ? Object.entries(answerMap).map(([k, v]) => ({
        id: k,
        label: qDef?.questions.find((q) => q.id === k)?.question ?? k,
        value: v,
      }))
    : [];

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16">
      <main className="mx-auto max-w-xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Link href="/canmou" className="text-xs text-accent hover:underline">
            ← 参谋首页
          </Link>
          <span className="text-[10px] text-foreground/45">{formatTime(data.created_at)}</span>
        </div>

        <p className="text-xs text-accent">{data.domainName}</p>
        <h1 className="mt-1 text-lg font-semibold text-foreground">历史参谋建议</h1>

        <article className="mt-4 rounded-xl border border-foreground/15 bg-foreground/[0.02] p-4">
          <h2 className="text-xs font-medium uppercase tracking-wider text-foreground/50">建议正文</h2>
          <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{data.result}</div>
          <p className="mt-4 border-t border-foreground/10 pt-3 text-[11px] leading-relaxed text-foreground/55">
            {DISCLAIMER}
          </p>
        </article>

        {entries.length > 0 ? (
          <details className="mt-4 rounded-xl border border-foreground/15 bg-foreground/[0.02] p-4">
            <summary className="cursor-pointer text-xs font-medium text-foreground/80">查看当时问卷答案</summary>
            <ul className="mt-3 space-y-2 border-t border-foreground/10 pt-3">
              {entries.map((row) => (
                <li key={row.id} className="text-[11px] leading-relaxed text-foreground/75">
                  <p className="font-medium text-foreground/85">{row.label}</p>
                  <p className="mt-0.5 whitespace-pre-wrap pl-0.5">{row.value || "—"}</p>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </main>
    </div>
  );
}
