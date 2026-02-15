"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { PublisherModal } from "./publisher-modal";
import { useLocale } from "@/lib/i18n/locale-context";
import { TranslateButton } from "@/components/translate-button";
import { getCurrentProfileId } from "@/lib/current-user";

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
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
}

type FeedTab = "all" | "following" | "followers";

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
      if (tab === "followers") return [] as Post[];
      const params = new URLSearchParams();
      params.set("locale", locale);
      if (type) params.set("type", type);
      if (q) params.set("q", q);
      if (profileId) params.set("userId", profileId);
      if (tab === "following") params.set("feed", "following");
      if (tab === "all") params.set("feed", "all");
      const res = await fetch(`/api/posts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<Post[]>;
    },
  });

  const { data: followData } = useQuery({
    queryKey: ["follows", profileId],
    queryFn: async () => {
      if (!profileId) return { following: [] as string[], followers: [] as string[] };
      const res = await fetch(`/api/follows?userId=${profileId}`);
      if (!res.ok) return { following: [], followers: [] };
      return res.json() as Promise<{ following: string[]; followers: string[] }>;
    },
  });
  const { data: members = [] } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const res = await fetch("/api/members");
      if (!res.ok) return [];
      return res.json();
    },
  });
  const followerIds = followData?.followers ?? [];
  const followerProfiles = members.filter((m: { id: string }) => followerIds.includes(m.id));

  const { data: savedPosts = [] } = useQuery({
    queryKey: ["saved-posts", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const res = await fetch(`/api/saved-posts?userId=${profileId}`);
      if (!res.ok) return [];
      return res.json();
    },
  });
  const savedPostIds = new Set((savedPosts as { id: string }[]).map((p) => p.id));

  const queryClient = useQueryClient();
  const handleSearch = () => setQ(searchInput.trim());

  const toggleSave = async (postId: string) => {
    if (!profileId) return;
    const isSaved = savedPostIds.has(postId);
    const method = isSaved ? "DELETE" : "POST";
    const res = await fetch("/api/saved-posts", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: profileId, post_id: postId }),
    });
    if (res.ok) queryClient.invalidateQueries({ queryKey: ["saved-posts", profileId] });
  };

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16">
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex gap-2 border-b border-foreground/10 pb-2">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`rounded px-3 py-1.5 text-xs font-medium ${tab === "all" ? "bg-accent/20 text-accent" : "text-foreground/70 hover:text-foreground"}`}
          >
            {t("community.feedAll")}
          </button>
          <button
            type="button"
            onClick={() => setTab("following")}
            className={`rounded px-3 py-1.5 text-xs font-medium ${tab === "following" ? "bg-accent/20 text-accent" : "text-foreground/70 hover:text-foreground"}`}
          >
            {t("community.feedFollowing")}
          </button>
          <button
            type="button"
            onClick={() => setTab("followers")}
            className={`rounded px-3 py-1.5 text-xs font-medium ${tab === "followers" ? "bg-accent/20 text-accent" : "text-foreground/70 hover:text-foreground"}`}
          >
            {t("community.feedFollowers")}
          </button>
        </div>
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <input
            type="search"
            placeholder={t("community.search")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 min-w-[120px] rounded-lg border border-foreground/20 bg-black/40 px-3 py-2 text-sm text-foreground placeholder:text-foreground/50 focus:border-accent/60 focus:outline-none"
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
            <option value="stance">{t("community.type.stance")}</option>
          </select>
        </div>

        {tab === "followers" ? (
          <ul className="space-y-3">
            {followerProfiles.length === 0 ? (
              <p className="text-sm text-foreground/50">{t("community.feedFollowers")} 暂无</p>
            ) : (
              followerProfiles.map((user: { id: string; display_name: string | null; avatar_url: string | null }) => (
                <li key={user.id}>
                  <Link
                    href={`/u/${user.id}`}
                    className="flex items-center gap-3 rounded-xl border border-foreground/10 bg-black/40 p-3 transition hover:border-accent/40"
                  >
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-foreground/20" />
                    )}
                    <span className="font-medium text-foreground">{user.display_name ?? "匿名"}</span>
                    <span className="text-xs text-accent">→ 名片</span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        ) : isLoading ? (
          <p className="text-center text-sm text-foreground/50">{t("community.loading")}</p>
        ) : (
          <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.id} className="rounded-xl border border-foreground/10 bg-black/40 p-4 transition hover:border-accent/40">
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
                <span className="rounded border border-foreground/20 px-1.5 py-0.5">
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
              <Link href={`/community/${post.id}`} className="block mt-1">
                <p className="line-clamp-2 text-sm text-foreground/70">
                  {post.content}
                </p>
              </Link>
              <div className="mt-3 flex gap-4 text-xs text-foreground/50">
                <span className="hover:text-accent">{t("community.like")}</span>
                <span className="hover:text-accent">{t("community.comment")}</span>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); toggleSave(post.id); }}
                  className={savedPostIds.has(post.id) ? "text-accent" : "hover:text-accent"}
                >
                  {savedPostIds.has(post.id) ? "已收藏" : t("community.favorite")}
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
