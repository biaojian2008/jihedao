"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { CANMOU_FREE_QUOTA, CANMOU_PAID_COST } from "@/lib/jihe-coin";
import { ShareButton } from "@/components/share-button";

type Message = { role: "user" | "assistant"; content: string; hasKnowledge?: boolean };

const EXAMPLES = [
  "警察在门外叫门，说要例行检查",
  "公司要求签自愿离职书，不签就辞退",
  "物业强行拖走我的电动车",
  "交警拦下我要查身份证",
  "社区工作人员要进门登记",
  "房东要强行进屋检查",
];

export default function SurvivalHandbookPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingFree, setRemainingFree] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    setError(null);

    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/canmou/survival", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = (await res.json()) as {
        content?: string;
        error?: string;
        remainingFree?: number;
        isFree?: boolean;
        hasKnowledge?: boolean;
        code?: string;
        required?: number;
      };

      if (!res.ok || data.error) {
        if (data.code === "INSUFFICIENT_JIHE") {
          setError(`已用完 ${CANMOU_FREE_QUOTA} 条免费额度，每条消息需 ${CANMOU_PAID_COST} 济和币，当前余额不足。`);
        } else {
          setError(data.error ?? "请求失败");
        }
        setMessages(messages); // 回滚用户消息
        return;
      }

      const assistantMsg: Message = {
        role: "assistant",
        content: data.content ?? "",
        hasKnowledge: data.hasKnowledge,
      };
      setMessages([...newMessages, assistantMsg]);
      if (typeof data.remainingFree === "number") {
        setRemainingFree(data.remainingFree);
      }
    } catch (e) {
      setError(`网络错误：${(e as Error).message}`);
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16 flex flex-col">
      <div className="mx-auto w-full max-w-2xl px-4 flex flex-col flex-1">
        {/* 头部 */}
        <header className="py-6 text-center border-b border-foreground/10">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-lg">🛡️</span>
            <h1 className="text-xl font-semibold text-foreground">生存手册</h1>
            <ShareButton
              url="/canmou/survival"
              title="🛡️ 生存手册 · 济和参谋"
              text="执法盘查、劳动纠纷、物业对抗——输入场景，直接出招"
              claimReward
            />
          </div>
          <p className="text-xs text-foreground/55">
            输入你遇到的场景，获取具体应对步骤 · 基于实战知识库
          </p>
          {remainingFree !== null && (
            <p className="mt-2 text-xs text-foreground/40">
              {remainingFree > 0
                ? `免费额度剩余 ${remainingFree} 条`
                : `免费额度已用完，每条消息消耗 ${CANMOU_PAID_COST} 济和币`}
            </p>
          )}
          {!user && (
            <p className="mt-2 text-xs text-amber-500/80">需要登录才能使用</p>
          )}
        </header>

        {/* 消息区 */}
        <div className="flex-1 py-4 space-y-4 overflow-y-auto">
          {messages.length === 0 && (
            <div className="py-8">
              <p className="text-xs text-foreground/40 text-center mb-4">常见场景（点击快速提问）</p>
              <div className="grid grid-cols-1 gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => sendMessage(ex)}
                    className="text-left text-sm px-4 py-3 rounded-xl border border-foreground/10 bg-foreground/[0.02] hover:border-foreground/25 hover:bg-foreground/[0.04] transition text-foreground/70"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "user" ? (
                <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-accent text-accent-foreground text-sm">
                  {msg.content}
                </div>
              ) : (
                <div className="max-w-[92%] space-y-1">
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-foreground/[0.04] border border-foreground/8 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>
                  {msg.hasKnowledge && (
                    <p className="text-[10px] text-foreground/30 px-1">✦ 基于知识库生成</p>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-foreground/[0.04] border border-foreground/8 text-sm text-foreground/40">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce" style={{ animationDelay: "0ms" }}>·</span>
                  <span className="animate-bounce" style={{ animationDelay: "150ms" }}>·</span>
                  <span className="animate-bounce" style={{ animationDelay: "300ms" }}>·</span>
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* 输入区 */}
        <div className="sticky bottom-20 md:bottom-4 pb-2 pt-2 bg-background/80 backdrop-blur-sm">
          <div className="flex gap-2 items-end border border-foreground/15 rounded-2xl px-3 py-2 focus-within:border-foreground/30 transition bg-background">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="描述你遇到的情况…（Enter 发送，Shift+Enter 换行）"
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-foreground/30 outline-none max-h-32 py-1"
              style={{ minHeight: "24px" }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = `${t.scrollHeight}px`;
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading || !user}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center disabled:opacity-30 transition hover:opacity-80"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-foreground/25 text-center mt-1.5">
            仅供参考，不构成法律意见
          </p>
        </div>
      </div>
    </div>
  );
}
