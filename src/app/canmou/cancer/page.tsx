"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { getOrCreateCanmouClientToken } from "@/lib/canmou-client-token";
import { CANMOU_PAID_COST } from "@/lib/jihe-coin";
import {
  CANCER_QUESTIONNAIRE_NAME,
  cancerQuestions,
  type CancerParsed,
  type CancerQuestion,
} from "@/lib/cancer/questionnaire";

type Phase = "intro" | "form" | "confirm" | "result";

type GuidelineRef = {
  source: string;
  source_url: string | null;
  cancer_type: string;
  subtype: string | null;
  stage: string | null;
};

type HospitalRef = {
  id: string;
  name: string;
  city?: string | null;
  jci_accredited?: boolean;
  specialties?: string[] | null;
  cost_range?: Record<string, unknown> | null;
  reputation_score?: number | null;
  intl_patient_contact?: string | null;
  source_url?: string | null;
};

const EMPTY_PARSED: CancerParsed = {
  cancer_type: "",
  subtype: "",
  stage: "",
  key_markers: "",
  prior_lines: "",
};

const PARSED_LABELS: { key: keyof CancerParsed; label: string }[] = [
  { key: "cancer_type", label: "癌症类型" },
  { key: "subtype", label: "病理亚型/基因突变" },
  { key: "stage", label: "分期" },
  { key: "key_markers", label: "关键指标" },
  { key: "prior_lines", label: "既往治疗概述" },
];

function validate(q: CancerQuestion, value: string, multi: Set<string>): boolean {
  if (q.type === "text") return true;
  if (q.type === "single") return Boolean(value);
  return multi.size > 0;
}

export default function CancerCarePage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [multiSel, setMultiSel] = useState<Set<string>>(new Set());
  const [parsed, setParsed] = useState<CancerParsed>(EMPTY_PARSED);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState("");
  const [disclaimer, setDisclaimer] = useState("");
  const [guidelines, setGuidelines] = useState<GuidelineRef[]>([]);
  const [hospitals, setHospitals] = useState<HospitalRef[]>([]);
  const [jiheBalance, setJiheBalance] = useState<number | null>(null);

  const refreshBalance = useCallback(async () => {
    try {
      const r = await fetch("/api/jihe-coin/balance");
      if (!r.ok) return setJiheBalance(null);
      const d = (await r.json()) as { balance?: number };
      setJiheBalance(typeof d.balance === "number" ? d.balance : null);
    } catch {
      setJiheBalance(null);
    }
  }, []);

  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance]);

  const total = cancerQuestions.length;
  const current = cancerQuestions[step];
  const progress = total ? ((step + 1) / total) * 100 : 0;
  const currentValue = current ? answers[current.id] ?? "" : "";

  useEffect(() => {
    const q = cancerQuestions[step];
    if (!q) return;
    if (q.type === "multi") {
      const ex = answers[q.id] ?? "";
      setMultiSel(ex ? new Set(ex.split(/、|,/).map((x) => x.trim()).filter(Boolean)) : new Set());
    } else {
      setMultiSel(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const setText = (id: string, v: string) => setAnswers((p) => ({ ...p, [id]: v }));
  const toggleMulti = (opt: string) =>
    setMultiSel((prev) => {
      const n = new Set(prev);
      if (n.has(opt)) n.delete(opt);
      else n.add(opt);
      return n;
    });

  const goNext = () => {
    if (!current) return;
    const merged = { ...answers };
    if (current.type === "multi") merged[current.id] = Array.from(multiSel).join("、");
    else merged[current.id] = currentValue;
    if (!validate(current, merged[current.id] ?? "", multiSel)) {
      setError("请完成本题后再继续");
      return;
    }
    setError(null);
    setAnswers(merged);
    if (step + 1 >= total) void submitParse(merged);
    else setStep((s) => s + 1);
  };

  const submitParse = async (finalAnswers: Record<string, string>) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/canmou/cancer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "parse", answers: finalAnswers }),
      });
      const d = (await r.json()) as { parsed?: CancerParsed; error?: string; details?: string };
      if (!r.ok) {
        if (r.status === 401) return setError("请先登录后再使用（登录后刷新本页）。");
        return setError([d.error, d.details].filter(Boolean).join(" — ") || "解析失败");
      }
      setParsed({ ...EMPTY_PARSED, ...(d.parsed ?? {}) });
      setPhase("confirm");
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  };

  const submitScreen = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/canmou/cancer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "screen",
          answers,
          parsed,
          clientToken: getOrCreateCanmouClientToken(),
        }),
      });
      const d = (await r.json()) as {
        content?: string;
        disclaimer?: string;
        guidelines?: GuidelineRef[];
        hospitals?: HospitalRef[];
        error?: string;
        details?: string;
      };
      if (!r.ok) {
        if (r.status === 401) return setError("请先登录后再生成（登录后刷新本页）。");
        return setError([d.error, d.details].filter(Boolean).join(" — ") || "生成失败");
      }
      void refreshBalance();
      setReport(d.content ?? "");
      setDisclaimer(d.disclaimer ?? "");
      setGuidelines(d.guidelines ?? []);
      setHospitals(d.hospitals ?? []);
      setPhase("result");
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  };

  const restart = () => {
    setPhase("intro");
    setStep(0);
    setAnswers({});
    setMultiSel(new Set());
    setParsed(EMPTY_PARSED);
    setReport("");
    setGuidelines([]);
    setHospitals([]);
    setError(null);
  };

  const shell = (children: ReactNode) => (
    <div className="min-h-screen pt-14 pb-28 md:pb-20">
      <main className="mx-auto max-w-xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/canmou" className="text-xs text-accent hover:underline">
            ← 参谋首页
          </Link>
          <span className="text-xs text-foreground/50">{CANCER_QUESTIONNAIRE_NAME}</span>
        </div>
        {children}
      </main>
    </div>
  );

  // ── 引导页 ──
  if (phase === "intro") {
    return shell(
      <div className="rounded-xl border border-red-500/30 bg-red-500/[0.04] p-5">
        <h1 className="text-xl font-semibold text-foreground">🏥 癌症国际就医参谋</h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground/75">
          为在国内治疗成本高或选择有限的癌症患者，做一次<strong>中立的信息梳理与对比</strong>：
          国内标准路径与费用、国际指南要点、印度等地的可及性——客观并列，供您和主治医生参考。
        </p>
        <ul className="mt-4 space-y-1.5 text-xs text-foreground/65">
          <li>· 只做信息梳理，<strong>不做诊断，也不给「值不值得去」的结论</strong></li>
          <li>· 印度医院信息均经人工核实后才展示</li>
          <li>· 病情数据去隐私化存储</li>
        </ul>
        <p className="mt-4 rounded-lg bg-foreground/5 p-3 text-[11px] leading-relaxed text-foreground/60">
          所有诊断与治疗决策请以持证医生为准。本工具不替代任何医疗建议。
        </p>
        <button
          type="button"
          onClick={() => setPhase("form")}
          className="mt-5 w-full rounded-full border border-accent bg-accent px-4 py-3 text-sm font-semibold text-black hover:bg-accent/90"
        >
          开始填写
        </button>
      </div>
    );
  }

  // ── 问卷 ──
  if (phase === "form") {
    return shell(
      <>
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => (step === 0 ? setPhase("intro") : setStep((s) => s - 1))}
            className="text-xs text-accent"
          >
            ← 上一步
          </button>
          <span className="text-[10px] text-foreground/45">
            {step + 1} / {total}
          </span>
        </div>
        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
          <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
        </div>

        {current ? (
          <div className="rounded-xl border border-foreground/15 bg-foreground/[0.02] p-4">
            <p className="text-sm font-medium text-foreground">{current.question}</p>
            {current.type === "text" ? (
              <textarea
                value={currentValue}
                onChange={(e) => setText(current.id, e.target.value)}
                rows={4}
                placeholder={current.placeholder}
                className="mt-3 w-full resize-none rounded-lg border border-foreground/25 bg-background px-3 py-2 text-sm text-foreground"
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
                        checked={currentValue === opt}
                        onChange={() => setText(current.id, opt)}
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
        ) : null}

        {error ? <p className="mt-3 text-xs text-red-500">{error}</p> : null}

        <button
          type="button"
          disabled={loading}
          onClick={goNext}
          className="mt-4 w-full rounded-full border border-accent bg-accent px-4 py-3 text-sm font-semibold text-black hover:bg-accent/90 disabled:opacity-50"
        >
          {loading ? "解析中…" : step + 1 >= total ? "提交并解析" : "下一题"}
        </button>
      </>
    );
  }

  // ── 人工确认解析结果 ──
  if (phase === "confirm") {
    return shell(
      <>
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/[0.05] p-4">
          <h1 className="text-base font-semibold text-foreground">请核对解析结果</h1>
          <p className="mt-2 text-xs leading-relaxed text-foreground/65">
            AI 从您的填写中提取了以下关键信息。<strong>解析可能有误，请核对并修改</strong>——这一步直接影响后续匹配的准确性。
          </p>
          <div className="mt-4 space-y-3">
            {PARSED_LABELS.map(({ key, label }) => (
              <div key={key}>
                <label className="text-[11px] text-foreground/55">{label}</label>
                <input
                  value={parsed[key]}
                  onChange={(e) => setParsed((p) => ({ ...p, [key]: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-foreground/25 bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
            ))}
          </div>
        </div>

        {error ? <p className="mt-3 text-xs text-red-500">{error}</p> : null}

        <p className="mt-4 text-center text-[11px] text-foreground/50">
          生成初筛报告将消耗 {CANMOU_PAID_COST} 济和币（前 10 条免费）
          {jiheBalance !== null ? ` · 当前余额 ${jiheBalance}` : null}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setPhase("form")}
            className="flex-1 rounded-full border border-foreground/20 px-4 py-3 text-sm text-foreground/70 hover:bg-foreground/5"
          >
            返回修改
          </button>
          <button
            type="button"
            disabled={loading || !parsed.cancer_type.trim()}
            onClick={() => void submitScreen()}
            className="flex-[2] rounded-full border border-accent bg-accent px-4 py-3 text-sm font-semibold text-black hover:bg-accent/90 disabled:opacity-50"
          >
            {loading ? "生成中…" : "确认无误，生成报告"}
          </button>
        </div>
      </>
    );
  }

  // ── 结果 ──
  return shell(
    <>
      <article className="rounded-xl border border-foreground/15 bg-foreground/[0.02] p-4">
        <h1 className="text-lg font-semibold text-foreground">初筛信息梳理</h1>
        <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {report}
        </div>
        <p className="mt-4 border-t border-foreground/10 pt-3 text-[11px] leading-relaxed text-foreground/55">
          {disclaimer}
        </p>
      </article>

      {guidelines.length ? (
        <section className="mt-5">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-accent/80">
            参考指南来源
          </h2>
          <ul className="space-y-2">
            {guidelines.map((g, i) => (
              <li
                key={i}
                className="rounded-lg border border-foreground/10 bg-foreground/[0.02] p-3 text-xs"
              >
                <span className="font-medium text-foreground/80">
                  {g.source} · {g.cancer_type}
                  {g.subtype ? ` / ${g.subtype}` : ""}
                  {g.stage ? ` / ${g.stage}` : ""}
                </span>
                {g.source_url ? (
                  <a
                    href={g.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-accent underline-offset-2 hover:underline"
                  >
                    查看原文 ↗
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-5">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-accent/80">
          匹配的印度医院
        </h2>
        {hospitals.length ? (
          <ul className="space-y-2">
            {hospitals.map((h) => (
              <li
                key={h.id}
                className="rounded-lg border border-foreground/10 bg-foreground/[0.02] p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{h.name}</span>
                  {h.jci_accredited ? (
                    <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-400">
                      JCI 认证
                    </span>
                  ) : null}
                  {h.city ? <span className="text-[11px] text-foreground/50">{h.city}</span> : null}
                </div>
                {Array.isArray(h.specialties) && h.specialties.length ? (
                  <p className="mt-1 text-[11px] text-foreground/60">
                    擅长：{h.specialties.join("、")}
                  </p>
                ) : null}
                {h.intl_patient_contact ? (
                  <p className="mt-1 text-[11px] text-foreground/60">
                    国际患者部：{h.intl_patient_contact}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-foreground/10 p-3 text-xs text-foreground/55">
            暂无匹配到的已核实医院。医院库仍在人工录入与核实中，后续会持续补充。
          </p>
        )}
      </section>

      <button
        type="button"
        onClick={restart}
        className="mt-6 w-full rounded-full border border-foreground/20 px-4 py-3 text-sm text-foreground/70 hover:bg-foreground/5"
      >
        重新开始
      </button>
    </>
  );
}
