"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";
import { AddMemberModal } from "./add-member-modal";
import { getCurrentProfileId } from "@/lib/current-user";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name: string;
};

type Member = {
  user_id: string;
  role: string;
  display_name: string;
  avatar_url: string | null;
};

const EMOJIS = "😀😃😄😁😅😂🤣😊😇🙂😉😌😍🥰😘😋😛😜🤪😝🤑🤗🤭🤔😐😏😣😮😴🤤😷🤒🤢🤮🤧🥵🥶😵🤯😎🤓😕😟😦😧😨😰😢😭😱😤😡👍👎👏🙌🤝🙏✌️🤞👌👈👉👆👇✋👋💪🦾👂👃🧠👀👁️".split("");

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp)(\?|$)/i;
const VIDEO_EXT = /\.(mp4|webm|mov|ogg|avi)(\?|$)/i;

function isMediaUrl(text: string): "image" | "video" | null {
  const t = text.trim();
  if (!/^https?:\/\//.test(t)) return null;
  if (IMAGE_EXT.test(t)) return "image";
  if (VIDEO_EXT.test(t)) return "video";
  return null;
}

type Props = { groupId: string; groupName: string; members: Member[]; canInvite: boolean };

export function GroupChatView({ groupId, groupName, members, canInvite }: Props) {
  const { t } = useLocale();
  const profileId = getCurrentProfileId();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sendContent = async (content: string) => {
    if (!content.trim() || !profileId || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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

  const fetchMessages = () => {
    fetch(`/api/groups/${groupId}/messages`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then(setMessages)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMessages();
    const id = setInterval(fetchMessages, 8000);
    return () => clearInterval(id);
  }, [groupId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || !profileId || sending) return;
    setInput("");
    await sendContent(text);
  };

  const createInvite = async () => {
    const res = await fetch(`/api/groups/${groupId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (data?.join_url) {
      setInviteUrl(data.join_url);
      navigator.clipboard.writeText(data.join_url);
    }
  };

  if (!profileId) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-foreground/60">{t("dm.needLogin")}</p>
        <Link href="/members" className="mt-4 inline-block text-xs text-accent">← {t("dm.backList")}</Link>
      </div>
    );
  }

  if (loading) {
    return <p className="p-8 text-center text-sm text-foreground/60">{t("intel.loading")}</p>;
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col px-4" style={{ height: "calc(100vh - 8rem)" }}>
      <div className="mb-2 shrink-0 flex items-center justify-between gap-2 rounded-lg border border-foreground/10 bg-black/40 p-2">
        <Link href="/members" className="shrink-0 text-xs text-accent hover:underline">← {t("dm.backList")}</Link>
        <button type="button" onClick={() => setShowMembers((v) => !v)} className="min-w-0 flex-1 truncate text-left text-sm font-medium">
          {groupName} ({members.length}人)
        </button>
        {canInvite && (
          <div className="flex gap-1">
            <button type="button" onClick={() => setAddMemberOpen(true)} className="shrink-0 rounded border border-foreground/30 px-2 py-1 text-xs">
              {t("groups.addMember")}
            </button>
            <button
              type="button"
              onClick={() => { setInviteOpen(true); createInvite(); }}
              className="shrink-0 rounded border border-accent/50 px-2 py-1 text-xs text-accent"
            >
              {t("groups.invite")}
            </button>
          </div>
        )}
      </div>
      {showMembers && (
        <div className="mb-2 max-h-32 overflow-y-auto rounded-lg border border-foreground/10 bg-black/40 p-2">
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-2 py-1">
              {m.avatar_url ? <img src={m.avatar_url} alt="" className="h-6 w-6 rounded-full" /> : <div className="h-6 w-6 rounded-full bg-foreground/20" />}
              <span className="text-xs">{m.display_name}</span>
              <span className="text-[10px] text-foreground/50">{m.role}</span>
            </div>
          ))}
        </div>
      )}
      {addMemberOpen && (
        <AddMemberModal
          groupId={groupId}
          existingIds={new Set(members.map((m) => m.user_id))}
          onClose={() => setAddMemberOpen(false)}
          onAdded={() => setAddMemberOpen(false)}
        />
      )}
      {inviteOpen && (
        <div className="mb-2 rounded-lg border border-accent/30 bg-accent/5 p-3">
          <p className="text-xs text-foreground/70">邀请链接已复制到剪贴板</p>
          <input type="text" readOnly value={inviteUrl} className="mt-2 w-full truncate rounded border border-foreground/20 bg-background px-2 py-1 text-xs" />
          <button type="button" onClick={() => setInviteOpen(false)} className="mt-2 text-xs text-accent">关闭</button>
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.map((m) => {
          const mediaType = isMediaUrl(m.content);
          const isMe = m.sender_id === profileId;
          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${isMe ? "bg-foreground/15 border border-foreground/20" : "bg-foreground/10"}`}>
                <p className="text-[10px] text-foreground/60">{m.sender_name}</p>
                {mediaType === "image" ? (
                  <a href={m.content.trim()} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.content.trim()} alt="" className="mt-1 max-h-48 rounded object-contain" />
                  </a>
                ) : mediaType === "video" ? (
                  <video src={m.content.trim()} controls className="mt-1 max-h-48 rounded" muted playsInline />
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
                <time className="mt-1 block text-[10px] text-foreground/50">{new Date(m.created_at).toLocaleString("zh-CN")}</time>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-foreground/10 pt-2 pb-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0))" }}>
        {showEmoji && (
          <div
            className="mb-2 max-h-28 overflow-y-auto rounded-lg border border-foreground/10 bg-black/40 p-2"
            style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif' }}
          >
            <div className="flex flex-wrap gap-1">
              {EMOJIS.map((e) => (
                <button key={e} type="button" className="rounded p-1 text-lg leading-none hover:bg-foreground/10" onClick={() => { setInput((s) => s + e); setShowEmoji(false); }}>{e}</button>
              ))}
            </div>
          </div>
        )}
        <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAndSendImage(f); e.target.value = ""; }} />
        {showPlusMenu && (
          <div className="mb-2 flex flex-wrap gap-2 rounded-lg border border-foreground/10 bg-black/40 p-2">
            <button type="button" onClick={() => galleryInputRef.current?.click()} disabled={uploadingMedia} className="rounded border border-foreground/20 px-3 py-2 text-xs hover:bg-foreground/10">相册 / 图片</button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <button type="button" onClick={() => { setShowPlusMenu((v) => !v); setShowEmoji(false); }} className="shrink-0 rounded-lg border border-foreground/20 p-2 text-foreground/70 hover:bg-foreground/10">+</button>
          <input
            type="text"
            placeholder={t("dm.inputPlaceholder")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            className="min-w-0 flex-1 rounded-lg border border-foreground/20 bg-black/40 px-3 py-2 text-sm placeholder:text-foreground/50 focus:border-accent/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowEmoji((v) => !v)}
            className="shrink-0 rounded-lg border border-foreground/20 p-2 text-foreground/70 hover:bg-foreground/10"
            aria-label="表情"
            style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif' }}
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
      </div>
    </div>
  );
}
