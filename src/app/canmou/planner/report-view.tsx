"use client";

import { useMemo, useRef, useState } from "react";
import { ShareButton } from "@/components/share-button";
import { getOrCreateCanmouClientToken } from "@/lib/canmou-client-token";
import { nodes, UNVERIFIED_NOTE } from "@/lib/planner/routes-data";
import type { Plan, PlannerReport } from "@/lib/planner/types";

const PLAN_COLORS: Record<Plan["key"], string> = {
  stable: "text-emerald-400 border-emerald-400/40 bg-emerald-400/5",
  balanced: "text-sky-400 border-sky-400/40 bg-sky-400/5",
  ambitious: "text-amber-400 border-amber-400/40 bg-amber-400/5",
};

function costText([lo, hi]: [number, number]): string {
  return `${lo}-${hi} 万`;
}

function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-400">已验证</span>
  ) : (
    <span className="rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] text-foreground/50">未人工核实</span>
  );
}

function PlanTimeline({ plan }: { plan: Plan }) {
  return (
    <div className="mt-4">
      {plan.fitWarnings.length > 0 ? (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
          <p className="text-xs font-medium text-amber-400">规则引擎校验提示</p>
          <ul className="mt-1.5 space-y-1">
            {plan.fitWarnings.map((w) => (
              <li key={w} className="text-xs leading-relaxed text-foreground/75">
                {w}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
        <div className="rounded-lg border border-foreground/10 p-2.5">
          <p className="text-foreground/50">全程约</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">{plan.totalYears} 年</p>
        </div>
        <div className="rounded-lg border border-foreground/10 p-2.5">
          <p className="text-foreground/50">总投入区间</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">{costText(plan.totalCostWan)}</p>
        </div>
        <div className="rounded-lg border border-foreground/10 p-2.5">
          <p className="text-foreground/50">信息级别</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {plan.verifiedLevel === "verified" ? "主线已验证" : plan.verifiedLevel === "partial" ? "部分已验证" : "未核实"}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2 rounded-lg border border-foreground/10 p-3 text-xs leading-relaxed">
        <p>
          <span className="font-medium text-foreground/60">代价：</span>
          <span className="text-foreground/85">{plan.tradeoff.replace(/^代价[：:]\s*/, "")}</span>
        </p>
        <p>
          <span className="font-medium text-foreground/60">赌点：</span>
          <span className="text-foreground/85">{plan.bet.replace(/^赌点[：:]\s*/, "")}</span>
        </p>
        <p>
          <span className="font-medium text-foreground/60">退出机制：</span>
          <span className="text-foreground/85">{plan.exitSummary}</span>
        </p>
      </div>

      {/* 时间轴节点图 */}
      <ol className="relative mt-5 space-y-4 border-l border-foreground/15 pl-4">
        {plan.steps.map((step) => {
          const node = nodes[step.nodeId];
          if (!node) return null;
          return (
            <li key={`${plan.key}-${step.nodeId}`} className="relative">
              <span
                className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ${
                  node.isDeathNode ? "bg-red-500" : node.forkLabel ? "bg-amber-400" : "bg-accent"
                }`}
              />
              <p className="text-[10px] text-foreground/45">
                第 {step.startYear + 1} 年起 · 孩子约 {step.childAgeAtStart} 岁
              </p>
              <div
                className={`mt-1 rounded-xl border p-3 ${
                  node.isDeathNode ? "border-red-500/40 bg-red-500/[0.04]" : "border-foreground/15 bg-foreground/[0.02]"
                }`}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground">{node.title}</span>
                  <VerifiedBadge verified={node.verified} />
                  {node.isDeathNode ? (
                    <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] text-red-400">⚠ 死亡节点</span>
                  ) : null}
                  {node.forkLabel ? (
                    <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-400">分岔口</span>
                  ) : null}
                </div>

                <p className="mt-1.5 text-xs leading-relaxed text-foreground/80">{node.summary}</p>

                {step.note ? (
                  <p className="mt-2 rounded-lg bg-accent/10 px-2.5 py-1.5 text-xs leading-relaxed text-foreground/85">
                    <span className="font-medium text-accent">针对您家：</span>
                    {step.note}
                  </p>
                ) : null}

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-foreground/60">
                  <span>
                    耗时 {node.durationMonths[0]}-{node.durationMonths[1]} 个月
                  </span>
                  <span>费用 {costText(node.costWan)}</span>
                </div>

                <details className="mt-2 group">
                  <summary className="cursor-pointer select-none text-[11px] text-accent/80 hover:text-accent">
                    准备清单 · 风险 · 出口
                  </summary>
                  <div className="mt-2 space-y-2 text-[11px] leading-relaxed">
                    {node.prerequisites.length ? (
                      <div>
                        <p className="font-medium text-foreground/60">前置条件</p>
                        <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-foreground/75">
                          {node.prerequisites.map((p) => (
                            <li key={p}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div>
                      <p className="font-medium text-foreground/60">准备清单</p>
                      <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-foreground/75">
                        {node.checklist.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </div>
                    <p>
                      <span className="font-medium text-foreground/60">失败风险：</span>
                      <span className="text-foreground/75">{node.risk}</span>
                    </p>
                    {node.isDeathNode && node.deathReason ? (
                      <p className="rounded-lg border border-red-500/30 bg-red-500/5 px-2.5 py-1.5 text-red-300/90">
                        <span className="font-medium text-red-400">为什么是死亡节点：</span>
                        {node.deathReason}
                      </p>
                    ) : null}
                    {node.forkLabel ? (
                      <p>
                        <span className="font-medium text-amber-400">分岔口：</span>
                        <span className="text-foreground/75">{node.forkLabel}</span>
                      </p>
                    ) : null}
                    <p>
                      <span className="font-medium text-foreground/60">备选出口：</span>
                      <span className="text-foreground/75">{node.exits.join("；")}</span>
                    </p>
                    {node.sources?.length ? (
                      <p className="text-foreground/50">
                        信源：
                        {node.sources.map((s, i) => (
                          <span key={s.name}>
                            {i > 0 ? "；" : ""}
                            <a href={s.url} target="_blank" rel="noreferrer" className="text-accent/70 underline-offset-2 hover:underline">
                              {s.name}
                            </a>
                            {s.verifiedAt ? `（核实于 ${s.verifiedAt}）` : "（未核实）"}
                          </span>
                        ))}
                      </p>
                    ) : null}
                  </div>
                </details>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function drawShareImage(report: PlannerReport): string {
  const W = 750;
  const H = 1000;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#0e1214";
  ctx.fillRect(0, 0, W, H);

  const wrap = (text: string, maxW: number, font: string): string[] => {
    ctx.font = font;
    const lines: string[] = [];
    let line = "";
    for (const ch of text) {
      if (ctx.measureText(line + ch).width > maxW) {
        lines.push(line);
        line = ch;
      } else {
        line += ch;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  let y = 80;
  ctx.fillStyle = "#8adbb4";
  ctx.font = "bold 40px sans-serif";
  ctx.fillText("孩子的全球发展路线图", 48, y);
  y += 30;
  ctx.fillStyle = "#5b6b66";
  ctx.font = "22px sans-serif";
  ctx.fillText("三套方案 · 各有代价与赌点 · 不给单一最优解", 48, y);
  y += 44;

  ctx.fillStyle = "#c9d4cf";
  for (const line of wrap(report.profileSummary, W - 96, "24px sans-serif").slice(0, 3)) {
    ctx.fillText(line, 48, y);
    y += 34;
  }
  y += 16;

  const colors: Record<string, string> = { stable: "#34d399", balanced: "#38bdf8", ambitious: "#fbbf24" };
  for (const plan of report.plans) {
    const boxH = 190;
    ctx.strokeStyle = colors[plan.key] ?? "#8adbb4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(48, y, W - 96, boxH, 16);
    ctx.stroke();

    ctx.fillStyle = colors[plan.key] ?? "#8adbb4";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText(plan.title, 72, y + 44);

    ctx.fillStyle = "#aab8b2";
    ctx.font = "20px sans-serif";
    ctx.fillText(`全程约 ${plan.totalYears} 年 · 总投入 ${plan.totalCostWan[0]}-${plan.totalCostWan[1]} 万`, 72, y + 80);

    ctx.fillStyle = "#7e8d87";
    for (const [i, line] of wrap(plan.bet, W - 144, "19px sans-serif").slice(0, 3).entries()) {
      ctx.fillText(line, 72, y + 112 + i * 27);
    }
    y += boxH + 20;
  }

  y = H - 60;
  ctx.fillStyle = "#5b6b66";
  ctx.font = "20px sans-serif";
  ctx.fillText("免费测算你家的路线图 → jihedao.xyz/canmou/planner", 48, y);

  return canvas.toDataURL("image/png");
}

function BookingForm({ reportId }: { reportId?: string }) {
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  const submit = async () => {
    if (!contact.trim()) {
      setErrMsg("请留下微信号或手机号");
      return;
    }
    setState("sending");
    setErrMsg("");
    try {
      const r = await fetch("/api/planner/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact,
          note,
          reportId,
          clientToken: getOrCreateCanmouClientToken(),
        }),
      });
      const data = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !data.ok) {
        setState("error");
        setErrMsg(data.error ?? "提交失败，请稍后重试");
        return;
      }
      setState("done");
    } catch {
      setState("error");
      setErrMsg("网络错误，请稍后重试");
    }
  };

  if (state === "done") {
    return (
      <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 text-sm text-emerald-400">
        已收到预约，顾问会尽快联系您逐项核实这些节点。
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <input
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        placeholder="微信号或手机号"
        className="w-full rounded-lg border border-foreground/25 bg-background px-3 py-2 text-sm text-foreground"
      />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="想重点核实哪些问题？（选填）"
        rows={2}
        className="w-full resize-none rounded-lg border border-foreground/25 bg-background px-3 py-2 text-sm text-foreground"
      />
      <button
        type="button"
        disabled={state === "sending"}
        onClick={() => void submit()}
        className="w-full rounded-full border border-accent bg-accent px-4 py-2.5 text-sm font-semibold text-black hover:bg-accent/90 disabled:opacity-50"
      >
        {state === "sending" ? "提交中…" : "预约人工诊断"}
      </button>
      {errMsg ? <p className="text-xs text-red-500">{errMsg}</p> : null}
    </div>
  );
}

export function ReportView({ report, reportId }: { report: PlannerReport; reportId?: string }) {
  const [activePlan, setActivePlan] = useState<Plan["key"]>(report.plans[0]?.key ?? "stable");
  const shareImgRef = useRef<HTMLAnchorElement>(null);

  const current = useMemo(
    () => report.plans.find((p) => p.key === activePlan) ?? report.plans[0],
    [activePlan, report.plans]
  );

  const downloadShareImage = () => {
    const dataUrl = drawShareImage(report);
    if (!dataUrl || !shareImgRef.current) return;
    shareImgRef.current.href = dataUrl;
    shareImgRef.current.download = "全球发展路线图.png";
    shareImgRef.current.click();
  };

  const shareUrl = reportId ? `/canmou/planner/report/${reportId}` : "/canmou/planner";

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-xl font-semibold text-foreground">孩子的全球发展路线图</h1>
        <p className="mt-1.5 text-xs leading-relaxed text-foreground/65">{report.profileSummary}</p>
        <div className="mt-2 flex items-center gap-1">
          <ShareButton
            url={shareUrl}
            title="孩子的全球发展路线图 · 济和"
            text="三套方案，各有代价与赌点——免费测算你家的十年路线图"
            claimReward
          />
          <button
            type="button"
            onClick={downloadShareImage}
            className="rounded p-2 text-xs text-foreground/60 transition hover:bg-foreground/10 hover:text-accent"
          >
            生成分享图
          </button>
          <a ref={shareImgRef} className="hidden" aria-hidden />
        </div>
      </header>

      {report.narrative ? (
        <div className="mb-5 rounded-xl border border-foreground/15 bg-foreground/[0.02] p-4">
          <p className="text-[10px] uppercase tracking-wider text-accent/70">导读（AI 根据引擎结果撰写）</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{report.narrative}</p>
        </div>
      ) : null}

      {/* 三方案切换 */}
      <div className="flex gap-2">
        {report.plans.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setActivePlan(p.key)}
            className={`flex-1 rounded-xl border px-2 py-2.5 text-xs font-medium transition ${
              p.key === activePlan ? PLAN_COLORS[p.key] : "border-foreground/15 text-foreground/55 hover:border-foreground/30"
            }`}
          >
            {p.title.split(" · ")[0]}
            <span className="mt-0.5 block text-[10px] font-normal opacity-70">{p.title.split(" · ")[1] ?? ""}</span>
          </button>
        ))}
      </div>

      {current ? (
        <>
          <p className="mt-3 text-xs leading-relaxed text-foreground/70">{current.tagline}</p>
          <PlanTimeline plan={current} />
        </>
      ) : null}

      {/* 其他国家概要（未核实） */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">其他方向概要</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-foreground/50">{UNVERIFIED_NOTE}</p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {report.otherCountries.map((c) => (
            <div key={c.name} className="rounded-xl border border-foreground/10 p-3">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground">{c.name}</span>
                <VerifiedBadge verified={false} />
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-foreground/70">{c.positioning}</p>
              <p className="mt-1 text-[11px] text-foreground/55">适合：{c.suitableFor}</p>
              <p className="text-[11px] text-foreground/55">费用量级：{c.costLevel}</p>
              <p className="text-[11px] text-foreground/45">主要不确定点：{c.mainUncertainty}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 诊断转化入口 */}
      <section className="mt-8 rounded-xl border border-accent/40 bg-accent/5 p-4">
        <h2 className="text-sm font-semibold text-accent">
          以下 {report.diagnosisNodes.length} 个节点需人工核实与定制
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-foreground/80">
          {report.diagnosisNodes.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-foreground/60">
          测算报告解决「方向与结构」，这些节点的当期政策细节和您家的具体材料，需要顾问一对一逐项确认。
        </p>
        <div className="mt-3">
          <BookingForm reportId={reportId} />
        </div>
      </section>

      <p className="mt-6 border-t border-foreground/10 pt-3 text-[11px] leading-relaxed text-foreground/50">
        {report.disclaimer}
      </p>
    </div>
  );
}
