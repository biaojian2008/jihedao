"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { PublisherModal } from "./publisher-modal";
import { useLocale } from "@/lib/i18n/locale-context";
import { TranslateButton } from "@/components/translate-button";
import { getCurrentProfileId } from "@/lib/current-user";
import {
  IconHeartOutline,
  IconHeartFilled,
  IconBookmarkOutline,
  IconBookmarkFilled,
  IconComment,
  IconTrash,
} from "@/components/layout/nav-icons";

type Post = {
  id: string;
  author_id: string;
  type: string;
  title: string;
  content: string;
  tags: string[] | null;
  credit_weight: number;
  created_at: string;
  author_name: string;
  author_credit: number;
  like_count?: number;
  comment_count?: number;
  liked_by_me?: boolean;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
}

type FeedTab = "all" | "saved" | "mine" | "liked" | "commented";

export function CommunityFeed() {
  const { t, locale } = useLocale();
  const profileId = getCurrentProfileId();
  const [tab, setTab] = useState<FeedTab>("all");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [publisherOpen, setPublisherOpen] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts", locale, type, q, profileId, tab],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("locale", locale);
      if (type) params.set("type", type);
      if (q) params.set("q", q);
      if (profileId) params.set("userId", profileId);
      if (tab === "all") params.set("feed", "all");
      else if (tab === "saved") params.set("feed", "saved");
      else if (tab === "mine") params.set("feed", "mine");
      else if (tab === "liked") params.set("feed", "liked");
      else if (tab === "commented") params.set("feed", "commented");
      const res = await fetch(`/api/posts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<Post[]>;
    },
  });

  const { data: savedPosts = [] } = useQuery({
    queryKey: ["saved-posts", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const res = await fetch(`/api/saved-posts?userId=${profileId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!profileId,
  });
  const savedPostIds = new Set((savedPosts as { id: string }[]).map((p) => p.id));

  const queryClient = useQueryClient();
  const handleSearch = () => setQ(searchInput.trim());

  const toggleSave = async (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!profileId) return;
    const isSaved = savedPostIds.has(postId);
    const method = isSaved ? "DELETE" : "POST";
    const res = await fetch("/api/saved-posts", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: profileId, post_id: postId }),
    });
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["saved-posts", profileId] });
      queryClient.invalidateQueries({ queryKey: ["posts", locale, type, q, profileId, tab] });
    }
  };

  const toggleLike = async (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!profileId) return;
    const post = posts.find((p) => p.id === postId);
    const isLiked = post?.liked_by_me ?? false;
    if (isLiked) {
      const res = await fetch(`/api/posts/${postId}/like?userId=${profileId}`, { method: "DELETE" });
      if (res.ok) queryClient.invalidateQueries({ queryKey: ["posts", locale, type, q, profileId, tab] });
    } else {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: profileId }),
      });
      if (res.ok) queryClient.invalidateQueries({ queryKey: ["posts", locale, type, q, profileId, tab] });
    }
  };

  const deletePost = async (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!profileId) return;
    if (!confirm(t("community.deleteConfirm") || "确定删除这篇帖子？")) return;
    const res = await fetch(`/api/posts/${postId}?userId=${encodeURIComponent(profileId)}`, { method: "DELETE" });
    if (res.ok) queryClient.invalidateQueries({ queryKey: ["posts", locale, type, q, profileId, tab] });
  };

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16">
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex gap-2 overflow-x-auto border-b border-foreground/10 pb-2">
          {(
            [
              ["all", "community.feedAll"],
              ["saved", "community.feedSaved"],
              ["mine", "community.feedMine"],
              ["liked", "community.feedLiked"],
              ["commented", "community.feedCommented"],
            ] as const
          ).map(([value, key]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`shrink-0 rounded px-3 py-1.5 text-xs font-medium ${tab === value ? "bg-accent/20 text-accent" : "text-foreground/70 hover:text-foreground"}`}
            >
              {t(key)}
            </button>
          ))}
        </div>
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <input
            type="search"
            placeholder={t("community.search")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="min-w-[120px] flex-1 rounded-lg border border-foreground/20 bg-black/40 px-3 py-2 text-sm text-foreground placeholder:text-foreground/50 focus:border-accent/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="rounded-lg border border-accent/60 px-3 py-2 text-xs font-medium text-accent"
          >
            {t("community.searchBtn")}
          </button>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-foreground/20 bg-black/40 px-3 py-2 text-xs text-foreground"
          >
            <option value="">{t("community.allTypes")}</option>
            <option value="project">{t("community.type.project")}</option>
            <option value="task">{t("community.type.task")}</option>
            <option value="product">{t("community.type.product")}</option>
            <option value="course">{t("community.type.course")}</option>
            <option value="demand">{t("community.type.demand")}</option>
            <option value="stance">{t("community.type.stance")}</option>
          </select>
        </div>

        {isLoading ? (
          <p className="text-center text-sm text-foreground/50">{t("community.loading")}</p>
        ) : (
          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.id} className="rounded-xl border border-foreground/10 bg-black/40 p-4 transition hover:border-accent/40">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-foreground/60">
                      <Link
                        href={`/u/${post.author_id}`}
                        className="font-medium text-foreground hover:text-accent"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {post.author_name}
                      </Link>
                      <span>·</span>
                      <span>{t("community.credit")} {post.author_credit}</span>
                      <span>·</span>
                      <span>{formatDate(post.created_at)}</span>
                      <span className="shrink-0 rounded border border-foreground/20 px-1.5 py-0.5">
                        {t(`community.type.${post.type}`) || post.type}
                      </span>
                    </div>
                    <div className="mt-2 flex items-start gap-2 flex-wrap">
                      <Link href={`/community/${post.id}`} className="min-w-0 flex-1">
                        <h2 className="text-base font-semibold text-foreground hover:text-accent">
                          {post.title}
                        </h2>
                      </Link>
                      <TranslateButton
                        text={post.title}
                        display="inline"
                        className="shrink-0 text-xs text-accent/90 hover:text-accent hover:underline disabled:opacity-60"
                      />
                    </div>
                    <Link href={`/community/${post.id}`} className="mt-1 block">
                      <p className="line-clamp-2 text-sm text-foreground/70">{post.content}</p>
                    </Link>
                  </div>
                  {tab === "mine" && profileId === post.author_id && (
                    <button
                      type="button"
                      onClick={(e) => deletePost(post.id, e)}
                      className="shrink-0 rounded p-2 text-foreground/50 hover:bg-red-500/20 hover:text-red-400"
                      aria-label={t("community.delete") || "删除"}
                      title={t("community.delete") || "删除"}
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs">
                  <button
                    type="button"
                    onClick={(e) => toggleLike(post.id, e)}
                    className="flex items-center gap-1.5 text-foreground/50 hover:text-accent"
                    aria-label={t("community.like")}
                  >
                    {post.liked_by_me ? (
                      <IconHeartFilled className="h-4 w-4 text-red-500" />
                    ) : (
                      <IconHeartOutline className="h-4 w-4" />
                    )}
                    <span>{post.like_count ?? 0}</span>
                  </button>
                  <Link
                    href={`/community/${post.id}`}
                    className="flex items-center gap-1.5 text-foreground/50 hover:text-accent"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={t("community.comment")}
                  >
                    <IconComment className="h-4 w-4" />
                    <span>{post.comment_count ?? 0}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => toggleSave(post.id, e)}
                    className={`flex items-center gap-1.5 ${savedPostIds.has(post.id) ? "text-accent" : "text-foreground/50 hover:text-accent"}`}
                    aria-label={t("community.favorite")}
                  >
                    {savedPostIds.has(post.id) ? (
                      <IconBookmarkFilled className="h-4 w-4" />
                    ) : (
                      <IconBookmarkOutline className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="fixed bottom-20 right-4 z-40 md:bottom-6">
          <button
            type="button"
            onClick={() => setPublisherOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl font-bold text-black shadow-lg transition hover:opacity-90"
            title={t("community.publish")}
            aria-label={t("community.publish")}
          >
            +
          </button>
        </div>
      </main>

      <PublisherModal open={publisherOpen} onClose={() => setPublisherOpen(false)} />
    </div>
  );
}
