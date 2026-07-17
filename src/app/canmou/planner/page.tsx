"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getOrCreateCanmouClientToken } from "@/lib/canmou-client-token";
import type { PlannerReport } from "@/lib/planner/types";
import { ReportView } from "./report-view";

type Q = {
  id: string;
  question: string;
  type: "single" | "multi" | "number" | "text";
  options?: string[];
  hint?: string;
};

/** 选项文案与 engine.ts 的映射表一一对应，改动需两边同步 */
const QUESTIONS: Q[] = [
  { id: "child_age", question: "孩子今年几岁？", type: "number", hint: "填数字即可，规划以孩子年龄为时间轴原点" },
  {
    id: "child_grade",
    question: "目前就读年级？",
    type: "single",
    options: ["还没上学", "幼儿园", "小学 1-3 年级", "小学 4-6 年级", "初中", "高中"],
  },
  {
    id: "child_english",
    question: "孩子目前的英语水平？",
    type: "single",
    options: ["零基础或很弱", "有基础，日常简单交流", "中等，能听懂部分英文课程", "较强，接近或达到全英文上课水平"],
  },
  {
    id: "child_traits",
    question: "孩子的性格更接近？（可多选）",
    type: "multi",
    options: ["外向开朗，自来熟", "内向慢热，需要时间适应", "自律，能自己安排学习", "需要督促", "好胜心强", "随遇而安", "恋家，依赖父母"],
  },
  {
    id: "parent_education",
    question: "父母的最高学历？",
    type: "single",
    options: ["大专及以下", "本科", "硕士及以上"],
  },
  {
    id: "parent_job",
    question: "家庭主要收入来源更接近？",
    type: "single",
    options: ["体制内工作", "企业受雇", "自营生意/企业主", "自由职业或远程工作", "投资收益或已退休"],
    hint: "这决定了「陪读期间收入是否可持续」这条硬校验",
  },
  {
    id: "budget",
    question: "每年可为孩子教育投入的预算？（万元人民币）",
    type: "single",
    options: ["10万以下", "10-20万", "20-40万", "40万以上"],
  },
  {
    id: "goal",
    question: "家庭的主要目标是？",
    type: "single",
    options: ["华侨生联考，回国读好大学", "海外读本科并就业", "给家庭留一个海外发展的备份方案", "还没想清楚，想看方案对比"],
  },
  {
    id: "preference",
    question: "做重大决定时，您家的风格更接近？",
    type: "single",
    options: ["求稳：政策确定性优先，随时能退", "性价比：每一分预算都要花在刀刃上", "上限优先：孩子的发展天花板最重要"],
  },
  {
    id: "risk",
    question: "对「路线中途失败」的承受度？",
    type: "single",
    options: ["很低，不能接受路线中途作废", "中等，可以接受有备选出口的风险", "较高，愿意为更高上限承担不确定性"],
  },
  {
    id: "keep_return",
    question: "是否必须保留回国升学/发展的选项？",
    type: "single",
    options: ["是，必须保留", "否，可以不保留"],
  },
  {
    id: "geo",
    question: "家庭的地理灵活性？",
    type: "single",
    options: ["全家可以搬过去", "一方家长可以长期陪读", "孩子可以单独就读寄宿学校", "近几年全家都走不开"],
  },
];

export default function PlannerPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"intro" | "form" | "result">("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [multiSel, setMultiSel] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<PlannerReport | null>(null);
  const [reportId, setReportId] = useState<string | undefined>(undefined);

  const current = QUESTIONS[step];
  const total = QUESTIONS.length;
  const value = current ? (answers[current.id] ?? "") : "";

  useEffect(() => {
    const q = QUESTIONS[step];
    if (q?.type === "multi") {
      const existing = answers[q.id] ?? "";
      setMultiSel(new Set(existing.split(/、|,/).map((x) => x.trim()).filter(Boolean)));
    }
    // 仅随题号切换恢复多选状态
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const setValue = (v: string) => setAnswers((prev) => ({ ...prev, [current.id]: v }));

  const toggleMulti = (opt: string) => {
    setMultiSel((prev) => {
      const n = new Set(prev);
      if (n.has(opt)) n.delete(opt);
      else n.add(opt);
      return n;
    });
  };

  const goNext = () => {
    const merged = { ...answers };
    if (current.type === "multi") merged[current.id] = Array.from(multiSel).join("、");

    const v = merged[current.id] ?? "";
    if (current.type === "number" && (!v || Number.isNaN(Number(v)))) {
      setError("请填写数字年龄");
      return;
    }
    if (current.type !== "multi" && current.type !== "text" && !v) {
      setError("请完成本题后再继续");
      return;
    }
    if (current.type === "multi" && multiSel.size === 0) {
      setError("请至少选择一项");
      return;
    }

    setError(null);
    setAnswers(merged);
    setMultiSel(new Set());

    if (step + 1 >= total) {
      void submit(merged);
      return;
    }
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setError(null);
    if (step > 0) setStep((s) => s - 1);
    else setPhase("intro");
  };

  const submit = async (finalAnswers: Record<string, string>) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers, clientToken: getOrCreateCanmouClientToken() }),
      });
      const data = (await r.json()) as { id?: string; report?: PlannerReport; error?: string };
      if (!r.ok || !data.report) {
        setError(data.error ?? "生成失败，请稍后重试");
        return;
      }
      if (data.id) {
        router.push(`/canmou/planner/report/${data.id}`);
        return;
      }
      setReport(data.report);
      setReportId(undefined);
      setPhase("result");
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  if (phase === "result" && report) {
    return (
      <div className="min-h-screen pt-14 pb-20 md:pb-16">
        <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
          <Link href="/canmou" className="text-xs text-accent hover:underline">
            ← 参谋首页
          </Link>
          <div className="mt-4">
            <ReportView report={report} reportId={reportId} />
          </div>
        </main>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="min-h-screen pt-14 pb-20 md:pb-16">
        <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
          <Link href="/canmou" className="text-xs text-accent hover:underline">
            ← 参谋首页
          </Link>
          <header className="mt-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">孩子未来 · 全球发展规划器</h1>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              根据孩子和家庭的真实条件，生成一张带时间轴的十年路线图——每一步做什么准备、耗时多久、花多少钱、哪里是分岔口、哪里是不能失手的环节。
            </p>
          </header>

          <ul className="mt-6 space-y-3 text-sm text-foreground/80">
            <li className="rounded-xl border border-foreground/15 bg-foreground/[0.02] p-3.5">
              <span className="font-medium text-accent">固定三套方案</span>
              <p className="mt-1 text-xs leading-relaxed text-foreground/65">
                稳健版（随时可退）、平衡版（预算利用最优）、进取版（上限最高）——各自标明代价和赌点，不给单一「最优解」。
              </p>
            </li>
            <li className="rounded-xl border border-foreground/15 bg-foreground/[0.02] p-3.5">
              <span className="font-medium text-accent">规则可复核</span>
              <p className="mt-1 text-xs leading-relaxed text-foreground/65">
                年龄窗口、预算、资格等硬条件由确定性规则判断；政策信息标注官方信源与核实日期。
              </p>
            </li>
            <li className="rounded-xl border border-foreground/15 bg-foreground/[0.02] p-3.5">
              <span className="font-medium text-accent">诚实分级</span>
              <p className="mt-1 text-xs leading-relaxed text-foreground/65">
                深度路线（首批：马来西亚国际教育、华侨生联考）经人工核实标「已验证」；其他方向明确标注「未人工核实」。
              </p>
            </li>
          </ul>

          <p className="mt-5 text-center text-[11px] text-foreground/50">测算免费 · 约 2 分钟 · 共 {total} 题</p>
          <button
            type="button"
            onClick={() => setPhase("form")}
            className="mt-2 w-full rounded-full border border-accent bg-accent px-4 py-3 text-sm font-semibold text-black hover:bg-accent/90"
          >
            开始测算
          </button>
        </main>
      </div>
    );
  }

  const progress = ((step + 1) / total) * 100;

  return (
    <div className="min-h-screen pt-14 pb-24 md:pb-16">
      <main className="mx-auto max-w-xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={goBack} className="text-xs text-accent">
            ← 上一步
          </button>
          <Link href="/canmou" className="text-xs text-foreground/50 hover:text-accent">
            返回
          </Link>
        </div>

        <p className="mb-1 text-xs text-accent">孩子未来 · 全球发展规划器</p>
        <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
          <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mb-4 text-[10px] text-foreground/45">
          {step + 1} / {total}
        </p>

        <div className="rounded-xl border border-foreground/15 bg-foreground/[0.02] p-4">
          <p className="text-sm font-medium text-foreground">{current.question}</p>
          {current.hint ? <p className="mt-1 text-[11px] text-foreground/50">{current.hint}</p> : null}

          {current.type === "number" ? (
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={18}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-3 w-full rounded-lg border border-foreground/25 bg-background px-3 py-2 text-sm text-foreground"
            />
          ) : null}

          {current.type === "single" && current.options ? (
            <ul className="mt-3 space-y-2">
              {current.options.map((opt) => (
                <li key={opt}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-foreground/15 px-3 py-2 text-sm hover:bg-foreground/5 has-[:checked]:border-accent/60 has-[:checked]:bg-accent/5">
                    <input
                      type="radio"
                      name={current.id}
                      checked={value === opt}
                      onChange={() => setValue(opt)}
                      className="accent-accent"
                    />
                    {opt}
                  </label>
                </li>
              ))}
            </ul>
          ) : null}

          {current.type === "multi" && current.options ? (
            <ul className="mt-3 space-y-2">
              {current.options.map((opt) => (
                <li key={opt}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-foreground/15 px-3 py-2 text-sm hover:bg-foreground/5 has-[:checked]:border-accent/60 has-[:checked]:bg-accent/5">
                    <input
                      type="checkbox"
                      checked={multiSel.has(opt)}
                      onChange={() => toggleMulti(opt)}
                      className="accent-accent"
                    />
                    {opt}
                  </label>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {error ? <p className="mt-3 text-xs text-red-500">{error}</p> : null}

        <button
          type="button"
          disabled={loading}
          onClick={goNext}
          className="mt-4 w-full rounded-full border border-accent bg-accent px-4 py-3 text-sm font-semibold text-black hover:bg-accent/90 disabled:opacity-50"
        >
          {loading ? "正在生成路线图…" : step + 1 >= total ? "生成三套方案路线图（免费）" : "下一题"}
        </button>
      </main>
    </div>
  );
}
