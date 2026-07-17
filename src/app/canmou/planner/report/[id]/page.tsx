"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { PlannerReport } from "@/lib/planner/types";
import { ReportView } from "../../report-view";

export default function PlannerReportPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [report, setReport] = useState<PlannerReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/planner?id=${encodeURIComponent(id)}`);
        const data = (await r.json()) as { report?: PlannerReport; error?: string };
        if (cancelled) return;
        if (!r.ok || !data.report) {
          setError(data.error ?? "报告加载失败");
          return;
        }
        setReport(data.report);
      } catch {
        if (!cancelled) setError("网络错误，请刷新重试");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16">
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/canmou" className="text-xs text-accent hover:underline">
            ← 参谋首页
          </Link>
          <Link href="/canmou/planner" className="text-xs text-foreground/55 hover:text-accent">
            测算我家的路线图 →
          </Link>
        </div>

        {error ? (
          <div className="py-16 text-center">
            <p className="text-sm text-foreground/70">{error}</p>
            <Link href="/canmou/planner" className="mt-3 inline-block text-sm text-accent hover:underline">
              重新测算
            </Link>
          </div>
        ) : !report ? (
          <p className="py-16 text-center text-sm text-foreground/50">报告加载中…</p>
        ) : (
          <ReportView report={report} reportId={id} />
        )}
      </main>
    </div>
  );
}
