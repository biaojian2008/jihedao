"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getCurrentProfileId } from "@/lib/current-user";
import { useLocale } from "@/lib/i18n/locale-context";
import { TranslateButton } from "@/components/translate-button";
import { TransferModal } from "@/components/transfer/transfer-modal";
import { getDisplayDid, getDisplayNameOrDid } from "@/lib/did";
import { IconMic } from "@/components/layout/nav-icons";

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

/** Web Speech API */
interface SpeechRecognitionResult {
  length: number;
  isFinal: boolean;
  0?: { transcript: string };
  item?(i: number): { transcript: string };
}
interface SpeechRecognitionResultList {
  length: number;
  item?(i: number): SpeechRecognitionResult;
  [i: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (e: { results: SpeechRecognitionResultList }) => void;
  onend: () => void;
  onerror: (e: { error: string }) => void;
  start: () => void;
  stop: () => void;
}

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
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
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
          setOtherUser({ id: otherId, display_name: data.participant_names[otherId] ?? getDisplayNameOrDid({ id: otherId }) });
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

  const startVoiceInput = () => {
    if (listening) return;
    if (typeof window === "undefined") return;
    if (!(window as unknown as { isSecureContext?: boolean }).isSecureContext) {
      alert("语音识别需在安全环境（HTTPS）下使用，请使用 https 访问。");
      return;
    }
    const win = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance };
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) {
      alert("您的浏览器不支持语音识别，请使用 Chrome 或 Edge 最新版。");
      return;
    }
    // 清理之前的实例
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    const rec = new SR() as SpeechRecognitionInstance;
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "zh-CN";
    rec.onresult = (e) => {
      const results = e.results;
      const len = results.length;
      if (len === 0) return;
      const lastIdx = len - 1;
      const result = results[lastIdx] ?? results.item?.(lastIdx);
      if (!result) return;
      const alt = result[0] ?? result.item?.(0);
      const transcript = alt?.transcript?.trim();
      if (transcript && result.isFinal) {
        setInput((s) => (s ? `${s} ${transcript}` : transcript));
      }
    };
    rec.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };
    rec.onerror = (e) => {
      const err = (e as { error?: string })?.error || "unknown";
      recognitionRef.current = null;
      setListening(false);
      if (err === "not-allowed") alert("请允许麦克风权限以使用语音输入。");
      else if (err === "no-speech") return; // 无语音，正常结束
      else if (err === "network") alert("网络错误，请检查网络后重试。");
      else if (err !== "aborted") alert("语音识别出错，请重试。");
    };
    try {
      rec.start();
      setListening(true);
      recognitionRef.current = rec;
    } catch (err) {
      recognitionRef.current = null;
      setListening(false);
      alert("启动语音识别失败，请确保已允许麦克风权限后重试。");
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);
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

  return (
    <div className="chat-container mx-auto max-w-xl px-4">
      <div className="mb-2 shrink-0">
        <div className="flex w-full items-center gap-3 rounded-lg border border-foreground/10 bg-black/40 p-2">
          <Link href="/dm" className="shrink-0 text-xs text-accent hover:underline">
            ← {t("dm.backList")}
          </Link>
          {otherUser && otherProfile && (
            <Link href={`/u/${otherProfile.id}`} className="flex min-w-0 flex-1 items-center gap-2">
              {otherProfile.avatar_url ? (
                <img src={otherProfile.avatar_url} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 shrink-0 rounded-full bg-foreground/20" />
              )}
              <span className="truncate text-sm font-medium text-foreground">{otherUser.display_name}</span>
            </Link>
          )}
        </div>
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
                  <p className="whitespace-pre-wrap emoji-ok">{m.content}</p>
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
      <div className="chat-input-wrapper shrink-0 border-t border-foreground/10 pt-2">
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
          <div
            className="mb-2 max-h-32 overflow-y-auto rounded-lg border border-foreground/10 bg-black/40 p-2"
            style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif' }}
          >
            <div className="flex flex-wrap gap-1">
              {EMOJIS.map((e) => (
                <button key={e} type="button" className="text-lg leading-none hover:bg-foreground/10 rounded p-1" onClick={() => { setInput((s) => s + e); setShowEmoji(false); }}>{e}</button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => (listening ? stopVoiceInput() : startVoiceInput())}
            className={`shrink-0 rounded p-1 ${listening ? "bg-red-500/20 text-red-400" : "text-foreground/60 hover:bg-foreground/10"}`}
            aria-label="语音"
          >
            <IconMic className="h-3.5 w-3.5" />
          </button>
          <input
            type="text"
            placeholder={t("dm.inputPlaceholder")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            className="min-w-0 flex-[1_1_0%] rounded-lg border border-foreground/20 bg-black/40 px-3 py-2 text-sm text-foreground placeholder:text-foreground/50 focus:border-accent/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => { setShowEmoji((v) => !v); setShowPlusMenu(false); }}
            className="shrink-0 rounded p-1 text-foreground/60 hover:bg-foreground/10"
            aria-label="表情"
            style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif' }}
          >
            <span className="text-sm leading-none">😀</span>
          </button>
          <button
            type="button"
            onClick={() => { setShowPlusMenu((v) => !v); setShowEmoji(false); }}
            className="shrink-0 rounded p-1 text-foreground/60 hover:bg-foreground/10"
            aria-label="更多"
          >
            <span className="text-xs font-medium">+</span>
          </button>
          <button
            type="button"
            onClick={send}
            disabled={sending || !input.trim()}
            className="shrink-0 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {t("dm.send")}
          </button>
        </div>
      </div>
    </div>
  );
}
