"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getCurrentProfileId } from "@/lib/current-user";
import { useLocale } from "@/lib/i18n/locale-context";
import { TranslateButton } from "@/components/translate-button";
import { TransferModal } from "@/components/transfer/transfer-modal";
import { getDisplayDid } from "@/lib/did";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name: string;
};

type OtherProfile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
  fid: string | null;
  custom_did: string | null;
  credit_score?: number;
};

const EMOJIS = "😀😃😄😁😅😂🤣😊😇🙂😉😌😍🥰😘😗😙😚😋😛😜🤪😝🤑🤗🤭🤫🤔😐😑😶😏😣😥😮🤐😯😪😫🥱😴🤤😷🤒🤕🤢🤮🤧🥵🥶🥴😵🤯🤠🥳🥸😎🤓🧐😕😟🙁☹️😮😯😲😳🥺😦😧😨😰😥😢😭😱😖😣😞😓😩😫🥱😤😡😠🤬😈💀☠️💩🤡👻💪👍👎👏🙌🤝🙏✌️🤞🤟🤘🤙👌🤌🤏👈👉👆👇☝️✋🤚🖐️🖖👋🤙💅🦾🦿🦵🦶👂🦻👃🧠🫀🫁🦷🦴👀👁️👅👄".split("");

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
  const [otherProfile, setOtherProfile] = useState<OtherProfile | null>(null);
  const [headerCollapsed, setHeaderCollapsed] = useState(true);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
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
    if (!otherUser?.id) return;
    fetch(`/api/users/${otherUser.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (p) setOtherProfile({ id: p.id, display_name: p.display_name ?? null, avatar_url: p.avatar_url ?? null, wallet_address: p.wallet_address ?? null, fid: p.fid ?? null, custom_did: p.custom_did ?? null, credit_score: p.credit_score });
      });
  }, [otherUser?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendContent = async (content: string) => {
    if (!content.trim() || !profileId || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender_id: profileId, content: content.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, { ...msg, sender_name: t("common.me") }]);
      }
    } finally {
      setSending(false);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || !profileId || sending) return;
    setInput("");
    await sendContent(text);
  };

  const uploadAndSendImage = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploadingMedia(true);
    setShowPlusMenu(false);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload/media", { method: "POST", credentials: "include", body: form });
      const data = await res.json().catch(() => ({}));
      if (data?.url) await sendContent(data.url);
    } finally {
      setUploadingMedia(false);
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

  const displayDid = otherProfile ? getDisplayDid(otherProfile.fid, otherProfile.custom_did) : "";

  return (
    <div className="mx-auto flex max-w-xl flex-col px-4" style={{ height: "calc(100vh - 8rem)", paddingBottom: "env(safe-area-inset-bottom, 0)" }}>
      <div className="mb-2 shrink-0">
        <button
          type="button"
          onClick={() => setHeaderCollapsed((c) => !c)}
          className="flex w-full items-center gap-3 rounded-lg border border-foreground/10 bg-black/40 p-2 text-left"
        >
          <Link href="/dm" className="shrink-0 text-xs text-accent hover:underline" onClick={(e) => e.stopPropagation()}>
            ← {t("dm.backList")}
          </Link>
          {otherUser && (
            <>
              {otherProfile?.avatar_url ? (
                <img src={otherProfile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-foreground/20" />
              )}
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{otherUser.display_name}</span>
                {!headerCollapsed && displayDid && <span className="block truncate font-mono text-[10px] text-foreground/60">{displayDid}</span>}
              </div>
              <span className="text-foreground/50">{headerCollapsed ? "▼" : "▲"}</span>
            </>
          )}
        </button>
        {!headerCollapsed && otherProfile && (
          <div className="mt-2 rounded-lg border border-foreground/10 bg-black/40 p-3 text-xs text-foreground/80">
            {displayDid && <p><span className="text-foreground/50">DID</span> {displayDid}</p>}
            {otherProfile.wallet_address && <p className="mt-1 truncate"><span className="text-foreground/50">钱包</span> {otherProfile.wallet_address}</p>}
            {otherProfile.credit_score != null && <p className="mt-1"><span className="text-foreground/50">信誉分</span> {otherProfile.credit_score}</p>}
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => { setShowTransfer(true); setHeaderCollapsed(true); }} className="rounded border border-accent/60 px-2 py-1 text-accent">{t("profile.transfer")}</button>
              <Link href={`/u/${otherProfile.id}`} className="rounded border border-foreground/30 px-2 py-1 hover:bg-foreground/10">个人名片</Link>
            </div>
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
                    ? "bg-foreground/15 text-foreground border border-foreground/20"
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
      <div className="shrink-0 border-t border-foreground/10 pt-2 pb-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0))" }}>
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadAndSendImage(f);
            e.target.value = "";
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadAndSendImage(f);
            e.target.value = "";
          }}
        />
        {showPlusMenu && (
          <div className="mb-2 flex flex-wrap gap-2 rounded-lg border border-foreground/10 bg-black/40 p-2">
            <button type="button" onClick={() => { setShowTransfer(true); setShowPlusMenu(false); }} className="rounded border border-foreground/20 px-3 py-2 text-xs hover:bg-foreground/10">{t("profile.transfer")}</button>
            <button type="button" onClick={() => galleryInputRef.current?.click()} disabled={uploadingMedia} className="rounded border border-foreground/20 px-3 py-2 text-xs hover:bg-foreground/10">相册</button>
            <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={uploadingMedia} className="rounded border border-foreground/20 px-3 py-2 text-xs hover:bg-foreground/10">拍摄</button>
          </div>
        )}
        {showEmoji && (
          <div className="mb-2 max-h-32 overflow-y-auto rounded-lg border border-foreground/10 bg-black/40 p-2">
            <div className="flex flex-wrap gap-1">
              {EMOJIS.map((e) => (
                <button key={e} type="button" className="text-lg leading-none hover:bg-foreground/10 rounded p-1" onClick={() => { setInput((s) => s + e); setShowEmoji(false); }}>{e}</button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => { setShowPlusMenu((v) => !v); setShowEmoji(false); }}
            className="shrink-0 rounded-lg border border-foreground/20 p-2 text-lg text-foreground/70 hover:bg-foreground/10"
            aria-label="更多"
          >
            +
          </button>
          <input
            type="text"
            placeholder="输入消息…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            className="min-w-0 flex-1 rounded-lg border border-foreground/20 bg-black/40 px-3 py-2 text-sm text-foreground placeholder:text-foreground/50 focus:border-accent/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => { setShowEmoji((v) => !v); setShowPlusMenu(false); }}
            className="shrink-0 rounded-lg border border-foreground/20 p-2 text-foreground/70 hover:bg-foreground/10"
            aria-label="表情"
          >
            😀
          </button>
          <button
            type="button"
            onClick={send}
            disabled={sending || !input.trim()}
            className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {t("dm.send")}
          </button>
        </div>
        <p className="mt-1 text-[10px] text-foreground/40">语音输入敬请期待</p>
      </div>
    </div>
  );
}
