"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getCurrentProfileId } from "@/lib/current-user";
import { useLocale } from "@/lib/i18n/locale-context";
import { TranslateButton } from "@/components/translate-button";
import { TransferModal } from "@/components/transfer/transfer-modal";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name: string;
};

type Props = { conversationId: string };

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp)(\?|$)/i;
const VIDEO_EXT = /\.(mp4|webm|mov|ogg|avi)(\?|$)/i;
function isMediaUrl(text: string): "image" | "video" | null {
  const trimmed = text.trim();
  if (!/^https?:\/\//.test(trimmed)) return null;
  if (IMAGE_EXT.test(trimmed)) return "image";
  if (VIDEO_EXT.test(trimmed)) return "video";
  return null;
}

export function ChatView({ conversationId }: Props) {
  const { t } = useLocale();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<{ id: string; display_name: string } | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const profileId = getCurrentProfileId();

  const fetchMessages = () => {
    fetch(`/api/conversations/${conversationId}/messages`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setMessages)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMessages();
  }, [conversationId]);

  useEffect(() => {
    if (!profileId || !conversationId) return;
    fetch(`/api/conversations/${conversationId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.participant_ids?.length || !data?.participant_names) return;
        const otherId = data.participant_ids.find((id: string) => id !== profileId);
        if (otherId) {
          setOtherUser({ id: otherId, display_name: data.participant_names[otherId] ?? "匿名" });
        }
      });
  }, [conversationId, profileId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || !profileId || sending) return;
    setSending(true);
    setInput("");
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender_id: profileId, content: text }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            ...msg,
            sender_name: t("common.me"),
          },
        ]);
      }
    } finally {
      setSending(false);
    }
  };

  if (!profileId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <p className="text-sm text-foreground/60">{t("dm.needUser")}</p>
        <Link href="/dm" className="mt-4 inline-block text-xs text-accent">
          ← {t("dm.backList")}
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <p className="text-sm text-foreground/60">加载对话…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col px-4" style={{ height: "calc(100vh - 8rem)" }}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link href="/dm" className="text-xs text-accent hover:underline">
          ← {t("dm.backList")}
        </Link>
        {otherUser && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground/80">{otherUser.display_name}</span>
            <button
              type="button"
              onClick={() => setShowTransfer(true)}
              className="rounded border border-accent/60 px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10"
            >
              {t("profile.transfer")}
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.map((m) => {
          const mediaType = isMediaUrl(m.content);
          return (
            <div
              key={m.id}
              className={`flex ${m.sender_id === profileId ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.sender_id === profileId
                    ? "bg-accent/20 text-foreground"
                    : "bg-foreground/10 text-foreground"
                }`}
              >
                <p className="text-[10px] text-foreground/60">{m.sender_name}</p>
                {mediaType === "image" ? (
                  <a href={m.content.trim()} target="_blank" rel="noopener noreferrer" className="block mt-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.content.trim()} alt="" className="max-h-48 rounded object-contain" />
                  </a>
                ) : mediaType === "video" ? (
                  <video
                    src={m.content.trim()}
                    controls
                    className="mt-1 max-h-48 rounded"
                    muted
                    playsInline
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
                {!mediaType && (
                  <TranslateButton text={m.content} display="inline" className="mt-1 text-[10px] text-accent/90 hover:text-accent" />
                )}
                <time className="mt-1 block text-[10px] text-foreground/50">
                  {new Date(m.created_at).toLocaleString("zh-CN")}
                </time>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {showTransfer && otherUser && (
        <TransferModal
          toUserId={otherUser.id}
          toUserName={otherUser.display_name}
          onClose={() => setShowTransfer(false)}
        />
      )}
      <div className="flex gap-2 border-t border-foreground/10 py-4">
        <input
          type="text"
          placeholder="输入消息…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          className="flex-1 rounded-lg border border-foreground/20 bg-black/40 px-3 py-2 text-sm text-foreground placeholder:text-foreground/50 focus:border-accent/60 focus:outline-none"
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || !input.trim()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {t("dm.send")}
        </button>
      </div>
    </div>
  );
}
