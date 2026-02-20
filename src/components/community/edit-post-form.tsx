"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentProfileId } from "@/lib/current-user";

type Props = { post: Record<string, unknown> };

export function EditPostForm({ post }: Props) {
  const router = useRouter();
  const profileId = getCurrentProfileId();
  const [title, setTitle] = useState(String(post.title ?? ""));
  const [content, setContent] = useState(String(post.content ?? ""));
  const [details, setDetails] = useState(String(post.details ?? ""));
  const [returnsDescription, setReturnsDescription] = useState(String(post.returns_description ?? ""));
  const [expectedDuration, setExpectedDuration] = useState(String(post.expected_duration ?? ""));
  const [repayWhen, setRepayWhen] = useState(String(post.repay_when ?? ""));
  const [authorCollateral, setAuthorCollateral] = useState(String((post.author_collateral as number) ?? 0));
  const [participantFreeze, setParticipantFreeze] = useState(String((post.participant_freeze as number) ?? 0));
  const [tagsStr, setTagsStr] = useState(Array.isArray(post.tags) ? (post.tags as string[]).join(", ") : "");
  const [mediaUrlsStr, setMediaUrlsStr] = useState(Array.isArray(post.media_urls) ? (post.media_urls as string[]).join("\n") : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const type = String(post.type ?? "");
  const isProjectOrTask = ["project", "task"].includes(type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId) return;
    setSaving(true);
    setError("");
    try {
      const mediaUrls = mediaUrlsStr.split(/\r?\n/).map((u) => u.trim()).filter((u) => u && /^https?:\/\//.test(u));
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: profileId,
          title: title.slice(0, 500),
          content: content.slice(0, 10000),
          tags: tagsStr.split(/[,，\s]+/).filter(Boolean).slice(0, 20),
          media_urls: mediaUrls,
          details: details.slice(0, 5000),
          returns_description: returnsDescription.slice(0, 2000),
          expected_duration: expectedDuration.slice(0, 200),
          repay_when: repayWhen.slice(0, 200),
          author_collateral: Number(authorCollateral) || 0,
          participant_freeze: Number(participantFreeze) || 0,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "保存失败");
        return;
      }
      router.push(`/community/${post.id}`);
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs text-foreground/70">标题 / 商品名 *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={500}
          className="w-full rounded-lg border border-foreground/20 bg-black/40 px-3 py-2 text-sm text-foreground"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-foreground/70">正文 / 商品介绍 *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          maxLength={10000}
          rows={6}
          className="w-full resize-none rounded-lg border border-foreground/20 bg-black/40 px-3 py-2 text-sm text-foreground"
        />
      </div>
      {isProjectOrTask && (
        <>
          <div>
            <label className="mb-1 block text-xs text-foreground/70">抵押 / 冻结 / 时长</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="0"
                value={authorCollateral}
                onChange={(e) => setAuthorCollateral(e.target.value)}
                placeholder="抵押"
                className="rounded border border-foreground/20 bg-black/40 px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                min="0"
                value={participantFreeze}
                onChange={(e) => setParticipantFreeze(e.target.value)}
                placeholder="冻结"
                className="rounded border border-foreground/20 bg-black/40 px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          <input
            value={expectedDuration}
            onChange={(e) => setExpectedDuration(e.target.value)}
            placeholder="预计时长"
            className="w-full rounded border border-foreground/20 bg-black/40 px-3 py-2 text-sm"
          />
          <textarea
            value={returnsDescription}
            onChange={(e) => setReturnsDescription(e.target.value)}
            placeholder="收益说明"
            rows={2}
            className="w-full resize-none rounded border border-foreground/20 bg-black/40 px-3 py-2 text-sm"
          />
        </>
      )}
      <div>
        <label className="mb-1 block text-xs text-foreground/70">标签</label>
        <input
          value={tagsStr}
          onChange={(e) => setTagsStr(e.target.value)}
          placeholder="逗号或空格分隔"
          className="w-full rounded border border-foreground/20 bg-black/40 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-foreground/70">图片链接（每行一个）</label>
        <textarea
          value={mediaUrlsStr}
          onChange={(e) => setMediaUrlsStr(e.target.value)}
          rows={2}
          className="w-full resize-none rounded border border-foreground/20 bg-black/40 px-3 py-2 text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {saving ? "保存中…" : "保存"}
        </button>
        <Link href={`/community/${post.id}`} className="rounded-lg border border-foreground/20 px-4 py-2 text-sm text-foreground/80 hover:bg-foreground/5">
          取消
        </Link>
      </div>
    </form>
  );
}
