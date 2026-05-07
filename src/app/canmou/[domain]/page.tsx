"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getOrCreateCanmouClientToken } from "@/lib/canmou-client-token";
import { CANMOU_FOLLOWUP_COST, CANMOU_MAIN_COST } from "@/lib/jihe-coin";
import { isCanmouDomain, questionnaires, type QuestionItem } from "@/lib/questionnaires";

type ChatTurn = { role: "user" | "assistant"; content: string };

const DISCLAIMER =
  "以上内容由AI生成，仅供参考，不构成法律、财务、税务或医疗建议。重要决策请咨询持牌专业人士。";

function validateStep(q: QuestionItem, value: string, multiSel: Set<string>): boolean {
  if (q.type === "text") return true;
  if (q.type === "single") return Boolean(value);
  if (q.type === "multi") return multiSel.size > 0;
  return false;
}

export default function CanmouDomainPage() {
  const params = useParams();
  const domainParam = typeof params.domain === "string" ? params.domain : "";
  const valid = isCanmouDomain(domainParam);
  const def = valid ? questionnaires[domainParam] : null;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [multiSel, setMultiSel] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<"form" | "result">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advice, setAdvice] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatTurn[]>([]);
  const [followUp, setFollowUp] = useState("");
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [jiheBalance, setJiheBalance] = useState<number | null>(null);

  const refreshJiheBalance = useCallback(async () => {
    try {
      const r = await fetch("/api/jihe-coin/balance");
      if (!r.ok) {
        setJiheBalance(null);
        return;
      }
      const data = (await r.json()) as { balance?: number };
      setJiheBalance(typeof data.balance === "number" ? data.balance : null);
    } catch {
      setJiheBalance(null);
    }
  }, []);

  useEffect(() => {
    void refreshJiheBalance();
  }, [refreshJiheBalance]);

  const questions = def?.questions ?? [];
  const current = questions[step];
  const total = questions.length;
  const progress = total ? ((step + 1) / total) * 100 : 0;

  const currentTextValue = current ? (answers[current.id] ?? "") : "";

  useEffect(() => {
    const q = questions[step];
    if (!q) return;
    if (q.type === "multi") {
      const existing = answers[q.id] ?? "";
      setMultiSel(
        existing ? new Set(existing.split(/、|,/).map((x) => x.trim()).filter(Boolean)) : new Set()
      );
    } else {
      setMultiSel(new Set());
    }
    // 仅随题号切换同步多选状态，避免在填写文本时因 answers 更新而重置
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, domainParam]);

  const goNext = () => {
    if (!current || !def) return;
    const merged: Record<string, string> = { ...answers };
    if (current.type === "multi") merged[current.id] = Array.from(multiSel).join("、");
    else merged[current.id] = currentTextValue;

    if (!validateStep(current, merged[current.id] ?? "", multiSel)) {
      setError("请完成本题后再继续");
      return;
    }
    setError(null);
    setAnswers(merged);

    if (step + 1 >= total) {
      void submitQuestionnaire(merged);
      return;
    }

    setStep((s) => s + 1);
  };

  const goBack = () => {
    setError(null);
    if (step <= 0) return;
    setStep((s) => s - 1);
  };

  const submitQuestionnaire = async (finalAnswers: Record<string, string>) => {
    if (!valid) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/canmou", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: domainParam,
          answers: finalAnswers,
          clientToken: getOrCreateCanmouClientToken(),
        }),
      });
      const data = (await r.json()) as {
        content?: string;
        firstUserMessage?: string;
        consultationId?: string;
        error?: string;
        details?: string;
        code?: string;
      };
      if (!r.ok) {
        if (r.status === 401) {
          setError("请先登录后再使用济和参谋（登录后刷新本页）。");
          return;
        }
        const parts = [data?.error, data?.details].filter(Boolean);
        setError(parts.length ? parts.join(" — ") : "请求失败");
        return;
      }
      void refreshJiheBalance();
      const content = data.content ?? "";
      const firstUser = data.firstUserMessage ?? "";
      setAdvice(content);
      setChatMessages([
        { role: "user", content: firstUser },
        { role: "assistant", content },
      ]);
      setPhase("result");
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  };

  const sendFollowUp = async () => {
    const text = followUp.trim();
    if (!text || !valid || chatMessages.length === 0 || !consultationId) return;
    setLoading(true);
    setError(null);
    const nextThread: ChatTurn[] = [...chatMessages, { role: "user", content: text }];
    setFollowUp("");
    try {
      const r = await fetch("/api/canmou", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: domainParam,
          messages: nextThread.map((m) => ({ role: m.role, content: m.content })),
          clientToken: getOrCreateCanmouClientToken(),
          ...(consultationId ? { consultationId } : {}),
        }),
      });
      const data = (await r.json()) as {
        content?: string;
        consultationId?: string;
        error?: string;
        details?: string;
        code?: string;
      };
      if (!r.ok) {
        setFollowUp(text);
        if (r.status === 401) {
          setError("请先登录后再追问（登录后刷新本页）。");
          return;
        }
        const parts = [data?.error, data?.details].filter(Boolean);
        setError(parts.length ? parts.join(" — ") : "请求失败");
        return;
      }
      void refreshJiheBalance();
      const reply = data.content ?? "";
      setChatMessages([...nextThread, { role: "assistant", content: reply }]);
      setAdvice(reply);
      if (data.consultationId) setConsultationId(data.consultationId);
    } catch {
      setFollowUp(text);
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  };

  const onChangeText = (id: string, v: string) => {
    setAnswers((prev) => ({ ...prev, [id]: v }));
  };

  const toggleMulti = (opt: string) => {
    setMultiSel((prev) => {
      const n = new Set(prev);
      if (n.has(opt)) n.delete(opt);
      else n.add(opt);
      return n;
    });
  };

  if (!valid || !def) {
    return (
      <div className="min-h-screen pt-14 pb-20 md:pb-16">
        <main className="mx-auto max-w-xl px-4 py-12 text-center">
          <p className="text-sm text-foreground/70">未找到该参谋类型</p>
          <Link href="/canmou" className="mt-4 inline-block text-sm text-accent">
            ← 返回参谋首页
          </Link>
        </main>
      </div>
    );
  }

  if (phase === "result") {
    return (
      <div className="min-h-screen pt-14 pb-28 md:pb-20">
        <main className="mx-auto max-w-xl px-4 py-6 sm:px-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <Link href="/canmou" className="text-xs text-accent hover:underline">
              ← 参谋首页
            </Link>
            <span className="text-xs text-foreground/50">{def.name}</span>
          </div>

          <article className="rounded-xl border border-foreground/15 bg-foreground/[0.02] p-4">
            <h1 className="text-lg font-semibold text-foreground">参谋建议</h1>
            <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{advice}</div>
            <p className="mt-4 border-t border-foreground/10 pt-3 text-[11px] leading-relaxed text-foreground/55">{DISCLAIMER}</p>
            {consultationId ? (
              <p className="mt-3 text-center text-xs text-foreground/55">
                <Link
                  href={`/canmou/history/${consultationId}`}
                  className="text-accent underline-offset-2 hover:underline"
                >
                  在历史记录中打开本条
                </Link>
              </p>
            ) : null}
          </article>

          <section className="mt-6">
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-accent/80">继续追问</h2>
            <p className="mb-2 text-[11px] text-foreground/50">
              每条追问消耗 {CANMOU_FOLLOWUP_COST} 济和币
              {jiheBalance !== null ? ` · 当前余额 ${jiheBalance}` : null}
              {!consultationId ? " · 若主记录未保存则无法追问，请重新提交问卷。" : null}
            </p>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-foreground/10 p-2 text-xs">
              {chatMessages.length <= 2 ? (
                <p className="px-1 py-2 text-foreground/45">在下方输入追问，对话将带上完整上文。</p>
              ) : (
                chatMessages.slice(2).map((m, i) => (
                  <div
                    key={`${i}-${m.role}`}
                    className={`rounded px-2 py-1.5 ${m.role === "user" ? "bg-foreground/5 text-foreground/80" : "bg-accent/10 text-foreground/90"}`}
                  >
                    <span className="font-medium text-accent/90">{m.role === "user" ? "您" : "参谋"}</span>
                    <p className="mt-0.5 whitespace-pre-wrap">{m.content}</p>
                  </div>
                ))
              )}
            </div>
            <div className="mt-2 flex gap-2">
              <textarea
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                placeholder="输入追问…"
                rows={2}
                className="min-w-0 flex-1 resize-none rounded-lg border border-foreground/25 bg-background px-3 py-2 text-sm text-foreground"
              />
              <button
                type="button"
                disabled={loading || !followUp.trim() || !consultationId}
                onClick={() => void sendFollowUp()}
                className="shrink-0 self-end rounded-lg border border-accent bg-accent/15 px-4 py-2 text-sm font-medium text-accent hover:bg-accent hover:text-black disabled:opacity-40"
              >
                {loading ? "…" : "发送"}
              </button>
            </div>
            {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-14 pb-24 md:pb-16">
      <main className="mx-auto max-w-xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={goBack} disabled={step === 0} className="text-xs text-accent disabled:opacity-30">
            ← 上一题
          </button>
          <Link href="/canmou" className="text-xs text-foreground/50 hover:text-accent">
            返回
          </Link>
        </div>

        <p className="mb-1 text-xs text-accent">{def.name}</p>
        <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
          <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mb-4 text-[10px] text-foreground/45">
          {step + 1} / {total}
        </p>

        {current ? (
          <div className="rounded-xl border border-foreground/15 bg-foreground/[0.02] p-4">
            <p className="text-sm font-medium text-foreground">{current.question}</p>

            {current.type === "text" ? (
              <textarea
                value={currentTextValue}
                onChange={(e) => onChangeText(current.id, e.target.value)}
                rows={4}
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
                        checked={currentTextValue === opt}
                        onChange={() => onChangeText(current.id, opt)}
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

        <p className="mt-4 text-center text-[11px] text-foreground/50">
          生成参谋建议将消耗 {CANMOU_MAIN_COST} 济和币
          {jiheBalance !== null ? ` · 当前余额 ${jiheBalance}` : null}
        </p>

        <button
          type="button"
          disabled={loading}
          onClick={goNext}
          className="mt-3 w-full rounded-full border border-accent bg-accent px-4 py-3 text-sm font-semibold text-black hover:bg-accent/90 disabled:opacity-50"
        >
          {loading ? "生成中…" : step + 1 >= total ? "生成参谋建议" : "下一题"}
        </button>
      </main>
    </div>
  );
}
