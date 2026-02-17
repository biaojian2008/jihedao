"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";
import { TranslateButton } from "@/components/translate-button";
import { getCurrentProfileId } from "@/lib/current-user";
import { IconHeartOutline, IconHeartFilled, IconComment } from "@/components/layout/nav-icons";

type Post = {
  id: string;
  author_id: string;
  type: string;
  title: string;
  content: string;
  tags: string[] | null;
  created_at: string;
  author_name: string;
  author_credit: number;
  author_collateral?: number;
  participant_freeze?: number;
  expected_duration?: string;
  returns_description?: string;
  repay_when?: string;
  details?: string;
  contract_text?: string;
  participants_count?: number;
};

type Props = { post: Post };

export function PostDetailView({ post }: Props) {
  const { t } = useLocale();
  const [joined, setJoined] = useState(false);
  const [displayCount, setDisplayCount] = useState(post.participants_count ?? 0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const currentUserId = getCurrentProfileId();
  const isProjectOrTask = ["project", "task"].includes(post.type);
  const hasCollateral = (post.author_collateral ?? 0) > 0 || (post.participant_freeze ?? 0) > 0;
  const canParticipate = isProjectOrTask && (post.participant_freeze ?? 0) > 0 && currentUserId && currentUserId !== post.author_id;

  const { data: likeData, refetch: refetchLike } = useQuery({
    queryKey: ["post-like", post.id, currentUserId],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${post.id}/like?userId=${currentUserId ?? ""}`);
      if (!res.ok) return { liked: false, count: 0 };
      return res.json() as Promise<{ liked: boolean; count: number }>;
    },
  });
  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ["post-comments", post.id],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${post.id}/comments`);
      if (!res.ok) return [];
      return res.json() as Promise<{ id: string; author_id: string; author_name: string; content: string; created_at: string }[]>;
    },
  });
  const [commentInput, setCommentInput] = useState("");
  const [commentSending, setCommentSending] = useState(false);

  const toggleLike = async () => {
    if (!currentUserId) return;
    const liked = likeData?.liked ?? false;
    if (liked) {
      await fetch(`/api/posts/${post.id}/like?userId=${currentUserId}`, { method: "DELETE" });
    } else {
      await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUserId }),
      });
    }
    refetchLike();
  };

  const submitComment = async () => {
    const content = commentInput.trim();
    if (!content || !currentUserId || commentSending) return;
    setCommentSending(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author_id: currentUserId, content }),
      });
      if (res.ok) {
        setCommentInput("");
        refetchComments();
        refetchLike();
      }
    } finally {
      setCommentSending(false);
    }
  };

  useEffect(() => {
    if (!currentUserId || !canParticipate) return;
    setLoading(true);
    fetch(`/api/posts/${post.id}/participate?userId=${currentUserId}`)
      .then((r) => r.json())
      .then((d) => setJoined(d.joined ?? false))
      .finally(() => setLoading(false));
  }, [post.id, currentUserId, canParticipate]);

  const handleParticipate = async () => {
    if (!currentUserId || actionLoading) return;
    setError("");
    setActionLoading(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/participate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUserId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("publisher.errorPublish"));
        return;
      }
      setJoined(true);
      setDisplayCount((c) => c + 1);
    } catch {
      setError(t("publisher.errorNetwork"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleExit = async () => {
    if (!currentUserId || actionLoading) return;
    setError("");
    setActionLoading(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/exit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUserId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "退出失败");
        return;
      }
      setJoined(false);
      setDisplayCount((c) => Math.max(0, c - 1));
    } catch {
      setError(t("publisher.errorNetwork"));
    } finally {
      setActionLoading(false);
    }
  };

  const date = new Date(post.created_at).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article>
      <Link
        href="/community"
        className="mb-6 inline-block text-xs text-accent/80 hover:text-accent"
      >
        ← {t("post.back")}
      </Link>
      <div className="flex items-center gap-2 text-xs text-foreground/60">
        <Link
          href={`/u/${post.author_id}`}
          className="font-medium text-foreground hover:text-accent"
        >
          {post.author_name}
        </Link>
        <span>·</span>
        <span>{t("community.credit")} {post.author_credit}</span>
        <span>·</span>
        <span>{date}</span>
        <span className="rounded border border-foreground/20 px-1.5 py-0.5">
          {t(`community.type.${post.type}`) || post.type}
        </span>
      </div>
      {post.type !== "stance" && (
        <h1 className="mt-2 text-2xl font-semibold text-accent">{post.title}</h1>
      )}
      {post.type === "stance" && post.title && post.title !== "观点" && (
        <p className="mt-2 text-sm text-foreground/60">{post.title}</p>
      )}
      {post.tags?.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded border border-foreground/20 px-2 py-0.5 text-[10px] text-foreground/70"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {/* 项目/任务详情信息 */}
      {hasCollateral && (
        <div className="mt-6 space-y-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
          {post.expected_duration ? (
            <div>
              <span className="text-xs font-medium text-accent/80">{t("post.expectedDuration")}：</span>
              <span className="text-sm text-foreground">{post.expected_duration}</span>
            </div>
          ) : null}
          {post.details ? (
            <div>
              <span className="text-xs font-medium text-accent/80">{t("post.details")}：</span>
              <div className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{post.details}</div>
              <TranslateButton text={post.details} />
            </div>
          ) : null}
          {post.returns_description ? (
            <div>
              <span className="text-xs font-medium text-accent/80">{t("post.returns")}：</span>
              <div className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{post.returns_description}</div>
              <TranslateButton text={post.returns_description} />
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-foreground/60">{t("post.authorCollateral")}：</span>
              <span className="font-medium text-accent">{(post.author_collateral ?? 0)} 济和币</span>
            </div>
            <div>
              <span className="text-xs text-foreground/60">{t("post.participantFreeze")}：</span>
              <span className="font-medium text-accent">{(post.participant_freeze ?? 0)} 济和币</span>
            </div>
          </div>
          <div>
            <span className="text-xs text-foreground/60">{t("post.repayWhen")}：</span>
            <span className="text-sm text-foreground">{post.repay_when || "项目完成时归还"}</span>
          </div>
        </div>
      )}

      <div className="mt-6">
        {post.type !== "stance" && <p className="text-xs font-medium text-foreground/60">{t("publisher.content")}（简介）</p>}
        <div className={`whitespace-pre-wrap text-foreground/90 ${post.type === "stance" ? "text-base" : "mt-1 text-sm"}`}>
          {post.content}
        </div>
        <TranslateButton text={post.content} />
      </div>

      {/* 智能合约 */}
      {post.contract_text && (
        <div className="mt-6 rounded-xl border border-foreground/20 bg-black/40 p-4">
          <h3 className="mb-3 text-sm font-semibold text-accent">{t("post.contract")}</h3>
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/90">
            {post.contract_text}
          </pre>
        </div>
      )}

      {/* 点赞、评论 */}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={toggleLike}
          className="flex items-center gap-2 text-foreground/70 hover:text-accent"
          aria-label={t("community.like")}
        >
          {likeData?.liked ? (
            <IconHeartFilled className="h-5 w-5 text-red-500" />
          ) : (
            <IconHeartOutline className="h-5 w-5" />
          )}
          <span>{likeData?.count ?? 0}</span>
        </button>
        <span className="flex items-center gap-2 text-foreground/70">
          <IconComment className="h-5 w-5" />
          <span>{comments.length}</span> {t("community.comment")}
        </span>
      </div>

      {/* 评论列表 */}
      <div className="mt-6 border-t border-foreground/10 pt-6">
        <h3 className="mb-3 text-sm font-medium text-foreground/80">{t("community.comment")}</h3>
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-foreground/10 bg-black/30 px-3 py-2 text-sm">
              <div className="flex items-center gap-2 text-xs text-foreground/60">
                <Link href={`/u/${c.author_id}`} className="font-medium text-foreground hover:text-accent">
                  {c.author_name}
                </Link>
                <time>{new Date(c.created_at).toLocaleString("zh-CN")}</time>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-foreground/90">{c.content}</p>
            </li>
          ))}
        </ul>
        {currentUserId ? (
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submitComment()}
              placeholder={t("community.commentPlaceholder") || "写一条评论…"}
              className="min-w-0 flex-1 rounded-lg border border-foreground/20 bg-black/40 px-3 py-2 text-sm text-foreground placeholder:text-foreground/50 focus:border-accent/60 focus:outline-none"
            />
            <button
              type="button"
              onClick={submitComment}
              disabled={commentSending || !commentInput.trim()}
              className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {commentSending ? "…" : t("community.commentSubmit") || "发送"}
            </button>
          </div>
        ) : (
          <p className="mt-4 text-xs text-foreground/50">{t("post.needLogin")}</p>
        )}
      </div>

      {/* 参加 / 退出 */}
      {canParticipate && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {!loading && (
            <>
              {joined ? (
                <button
                  type="button"
                  onClick={handleExit}
                  disabled={actionLoading}
                  className="rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                >
                  {actionLoading ? "..." : t("post.exit")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleParticipate}
                  disabled={actionLoading}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
                >
                  {actionLoading ? "..." : t("post.participate")}
                </button>
              )}
              <span className="text-xs text-foreground/60">
                {t("post.participants")}：{displayCount}
              </span>
            </>
          )}
          {!currentUserId && (
            <p className="text-xs text-foreground/60">{t("post.needLogin")}</p>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </article>
  );
}
